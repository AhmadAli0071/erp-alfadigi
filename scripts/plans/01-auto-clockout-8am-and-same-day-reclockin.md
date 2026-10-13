# Plan: Auto Clock-Out at 8 AM (0 hours + notify) & Same-Day Re-Clock-In

## Requirements (confirmed)

1. **Auto clock-out ab 3 AM ki jagah 8:00 AM (PKT) ho.**
   - Jiska auto clock-out ho: **working hours = 0** (UI me show na hon, salary me count na hon → **us din ka salary cut**).
   - Notification (in-app, **English**) employee + uske Lead + HR dono ko:
     *"You did not clock out on time for {date}. The system automatically clocked you out at 08:00 AM (PKT). Your working hours are not shown and will not be counted in your salary. If this happened by mistake, please contact HR."*
   - Record pe badge/label "auto clock-out" dikhe (history + HR views).
2. **Accidental clock-out ke baad same din me dobara clock-in allow ho** — jitni baar clock-out kare, same day clock-in kar sake; total working hours sab sessions ka sum ho.

## Current behavior (root causes)

- `server/src/jobs/autoAbsent.ts:135-169` — sweep (`*/5` UTC) auto clock-out karta hai `shiftEnd + grace` = **03:10 AM PKT** par, aur **working minutes compute karke count karta hai** (naye rule ke ulta). Koi `isAutoClockedOut` flag nahi.
- `server/src/routes/attendance.ts:197-201` — clock-in par `if (existing && existing.clockIn) → 409 'Already clocked in today'` (chahe clock-out ho chuka ho).
- `client/src/components/attendance/ClockButtonsCard.tsx:501` — CLOCK IN button `disabled` unless state `not_clocked_in`.
- Salary calc me **Late + `stayedTillEnd`** branch (`server/src/utils/salaryCalc.ts:238-251`) auto-CO record ko full required minutes de sakta hai (8 AM clock-out `>= shift end` hai) — **guard zaroori hai**.

## Design decisions

- Naya setting `attendance.autoClockOutTime` (default `'08:00 AM'`, PKT) — HR settings panel me editable.
- Schema me 2 naye fields: `isAutoClockedOut: boolean`, `sessionBreakBase: number`.
- **Multi-session model (single record/employee/date rehta hai — unique index same):**
  - Open record `workingMinutes` = **prior sessions ka net total** (session 1 me 0 rehta hai).
  - Re-clock-in: `sessionBreakBase = breakMinutes` (aaj ke ab tak ke breaks prior sessions ko belong karte hain), `clockOut/clockOutAt` clear, `isAutoClockedOut = false`, **late-check/half-day-penalty logic skip**.
  - Clock-out: `working = (workingMinutes as prior net) + sessionGross - (breakMinutes - sessionBreakBase)`; `hoursManuallySet` phir bhi win karta hai.
  - Breaks (`breakMinutes`, `breakMinutesByType`) **day-total** rehte hain (budgets pe koi asar nahi).
- Salary: `isAutoClockedOut && !hoursManuallySet` → **full-day shortfall** (`Missed clock-out — hours not counted`), approved OT phir bhi count ho, `stayedTillEnd` bypass.
- No DB migration — schema defaults + `|| 0` checks purane records ke liye safe hain.

## Changes — Server

### 1. `server/src/models/Attendance.ts`
- Interface + schema me add:
  - `isAutoClockedOut?: boolean` (default `false`)
  - `sessionBreakBase?: number` (default `0`)

### 2. `server/src/utils/defaults.ts`
- `DEFAULT_SETTINGS.attendance` me add: `autoClockOutTime: '08:00 AM'` (deepMerge purane settings ko fill kar dega — `defaults.ts:211-222`).

### 3. `server/src/jobs/autoAbsent.ts`
- `AttendanceConfig` + `getAttendanceConfig()` me add `autoOut: {h, m}` — parse `att.autoClockOutTime || '08:00 AM'`, catch-fallback `{h:8, m:0}`.
- `shiftEndUtcFor` ko generalize (ya helper `autoClockOutUtcFor`) — recordDate + autoOut time (PKT→UTC), overnight wrap ke sath (existing logic reuse, `autoAbsent.ts:101-111`).
- `runAttendanceSweep` (`autoAbsent.ts:135-169`) ka auto-CO branch naya:
  - Trigger: `now >= autoClockOutUtcFor(recordDate)` (ab `shiftEnd + grace` nahi) → effective **08:00–08:05 AM PKT**.
  - `clockOut = '08:00 AM'`, `clockOutAt = autoClockOutUtc`, `isAutoClockedOut = true`.
  - Agar `!hoursManuallySet`: `workingMinutes = 0`; status `statusForWorkingMinutes(0, …)` = `Short Hours` (WFH/On Duty/Late designations preserve — existing check).
  - `notes`: `Auto clock-out at 08:00 AM (PKT) — missed clock-out, hours not counted`.
  - Notification: employee ko `notifyEmails([emp.email], {title: 'Missed Clock-Out — Hours Not Counted', message: <English msg>, type: 'attendance'})` + `notifyAttendanceEvent(...)` se Lead + HR (existing helper `attendance.ts:17-31`).
- Comment header (`autoAbsent.ts:8-23`) update.

### 4. `server/src/routes/attendance.ts`
- **Clock-in (`:176-252`):**
  - 409 sirf tab jab record open ho: `existing && existing.clockIn && !existing.clockOut`.
  - Naya **re-entry path** jab `existing.clockOut` set ho:
    - `sessionBreakBase = breakMinutes` (agar `!hoursManuallySet`).
    - `clockIn = timeStr`, `clockInAt = now`, `clockOut = ''`, `clockOutAt = null`.
    - `isAutoClockedOut = false`.
    - Status: Late/WFH/On Duty preserve, warna `'Present'` (re-entry late nahi).
    - **Late/lateCount/half-day notification logic skip**; normal `notifyAttendanceEvent` do (team board live).
    - Response `reentered: true` bhejo.
- **Clock-out (`:254-345`):**
  - `working = (attendance.workingMinutes || 0) + sessionGross - (attendance.breakMinutes - (attendance.sessionBreakBase || 0))` (`sessionGross` = existing midnight-wrap math `:309-314`).
  - `sessionBreakBase` reset 0 after save (ya re-entry par reset hoga — consistent rakho: re-entry par assign hota hai, yahan chhodo).
  - `hoursManuallySet` guard existing hi rehne do (`:316`).
- **`GET /today/:email` (`:534-548`)** me add: `isAutoClockedOut`, `sessionBreakBase` (+ `workingMinutes` already hai).
- **`GET /history/:email` (`:726-741`)** me add: `isAutoClockedOut`.
- **`GET /hr` list mapping (~`:1023-1130`)** me add: `isAutoClockedOut` (HR view badge ke liye — exact mapping shape implement time pe).

### 5. `server/src/utils/salaryCalc.ts`
- Record loop me (weekend/Leave/Absent ke baad, Late branch se pehle, ~`:215`):
  ```ts
  if (rec.isAutoClockedOut && !rec.hoursManuallySet) {
    // approved OT still credited
    log.push({ date, type: '-', reason: 'Missed clock-out — auto clock-out, hours not counted', minutes: requiredMinutes, amount });
    shortfallMinutes += requiredMinutes;
    continue;
  }
  ```
  → 0 worked minutes, full-day salary cut (user decision), `stayedTillEnd` bypass.
- **Open-shift live branch (`:218-234`)**: session-2 ko sahi count karo —
  `dayMinutes = (rec.workingMinutes || 0) + max(0, now - clockInAt - (breakMinutes - (sessionBreakBase||0)) - ongoingBreak)`.

### 6. `server/src/routes/hod.ts`
- `liveWorkingMinutes` (`:16-26`) me same fix: prior net base + `sessionBreakBase` se current-session breaks subtract.

## Changes — Client

### 7. `client/src/types/settings.ts`
- `AttendanceSettings` me add: `autoClockOutTime: string; // "08:00 AM"`

### 8. `client/src/components/settings/AttendanceSettingsPanel.tsx`
- Shift End ke baad naya input: **"Auto Clock-Out Time"** + hint: *"Open shifts are auto clocked out at this time (PKT) with 0 working hours — missed clock-out is not counted in salary."*

### 9. `client/src/components/attendance/ClockButtonsCard.tsx`
- `TodayAttendance` interface me add: `isAutoClockedOut: boolean; sessionBreakBase: number;` (state: `sessionBreakBase`, `wasAutoClockedOut`).
- **CLOCK IN** (`:495-504`): `disabled={clockState !== 'not_clocked_in' && clockState !== 'clocked_out'}`; sublabel clocked_out par `"Resume shift"`.
- `handleClockIn` (`:152-180`): success par `setClockOutTime(null)`; `reentered` ho to `fetchTodayStatus()` se resync (breaks/prior minutes waise aaye).
- **Live timer (`:392-399`)**: base = `workingMinutes * 60000` (prior sessions) + `(now − clockInAt)` − `(breakMinutes − sessionBreakBase) * 60000` − ongoing break.
- **Working Hours card (`:438-444`)**: `isAutoClockedOut && !liveElapsed` → value `'—'`, sub `"Not counted (missed clock-out)"` (rose).
- **Clocked-out banner (`:663-670`)**: `isAutoClockedOut` par warning variant:
  *"You missed clock-out — working hours are not counted today. Contact HR if this was a mistake."*
- `handleClockOut` response se total `workingMinutes` aata hai (existing `:261`) ✓.

### 10. `client/src/components/employee/EmployeeAttendanceView.tsx`
- `AttendanceRecord` interface (`:27-33`) me add `isAutoClockedOut?: boolean`.
- Row me (`:291-301`): auto-CO hone par working hours `00:00` + red chip **"Not counted"** (title tooltip: missed clock-out message).

### 11. HR table badge (small)
- `client/src/components/hr/HRAttendanceTable.tsx` — auto-CO row pe chhota red "Auto CO" chip (server `/hr` se flag aane ke baad).

## Verification

1. Server typecheck/build: `npm run build` (server dir).
2. Client: `npm run lint` (`tsc --noEmit`) + `npm run build`.
3. Manual dev check (START-ERP.bat / tsx): ek test account se clock-in → clock-out → **dobara clock-in (409 nahi aana chahiye)** → clock-out par total hours = sum. `/today` me `isAutoClockedOut`/`sessionBreakBase` fields.
4. Sweep ka auto-CO logic: local me `autoClockOutTime` ko kisi past time par set karke `runAttendanceSweep` run karke verify (ya VPS pe deploy ke baad next 8 AM `pm2 logs` check).

## Deployment (VPS — user requested)

1. `git add` (sirf relevant files; `VPS-DETAILS.txt` ignored hai) → `git commit` → `git push origin main`.
2. VPS (`plink` se):
   - `cd ~/erp && git pull`
   - `cd server && npm install && npm run build`
   - `cd ../client && npm install && npm run build`
   - `pm2 restart alfadigi-erp`
3. Verify: `https://erp.alfadigii.com/api/health`, `pm2 logs alfadigi-erp` (errors nahi), settings panel me naya "Auto Clock-Out Time" field.
4. Note: deploy ke baad koi bhi **currently open** attendance record next 8 AM par 0-hours + notification ke sath auto CO hoga (intended policy).

## Non-goals

- Email notifications nahi (sirf in-app SSE — `notifyEmails` naam ka helper in-app hi hai).
- Absent scan ka time (03:05 AM PKT) unchanged — wo clock-IN missing par hai, clock-out se related nahi.
- Purane records ka backfill nahi (jo already closed hain wo as-is).
