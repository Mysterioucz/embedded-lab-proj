# Live Status Feature - Quick Test Guide

## Visual Test Checklist

### ✅ Test 1: Fresh Data Shows Live
1. Start backend: `cd backend && pnpm run dev`
2. Start frontend: `cd frontend && pnpm run dev`
3. Start publisher: `pnpm run test:publisher`
4. Open: http://localhost:3000
5. **Expected**: All sensors show 🟢 "Live" with animated pulse

### ✅ Test 2: Old Data Shows Offline
1. Stop publisher (Ctrl+C)
2. Wait 30 seconds
3. **Expected**: All sensors change to ⚫ "Offline" (static)

### ✅ Test 3: Time Ago Updates
1. Watch the footer of any sensor card
2. **Expected**: "Xs ago" updates every second

### ✅ Test 4: Connection Loss
1. Stop backend (Ctrl+C)
2. **Expected**: Header shows "Disconnected" + all sensors "Offline"

### ✅ Test 5: Reconnection
1. Restart backend: `pnpm run dev`
2. Restart publisher: `pnpm run test:publisher`
3. **Expected**: Sensors return to "Live" state

## Visual Reference

### Live State
```
┌─────────────────────────────┐
│ Living Room        🟢 Live  │ ← Green dot, animated
│                              │
│ 🌡️ 23.5°C      💧 65.2%      │
│                              │
│ Jan 15, 10:30 AM    just now│ ← Time updates
└─────────────────────────────┘
```

### Offline State
```
┌─────────────────────────────┐
│ Living Room       ⚫ Offline │ ← Gray dot, static
│                              │
│ 🌡️ 23.5°C      💧 65.2%      │
│                              │
│ Jan 15, 10:30 AM      45s ago│ ← Shows age
└─────────────────────────────┘
```

## Quick Commands

```bash
# Start everything
pnpm run dev                    # In root (both services)
pnpm run test:publisher         # Send test data

# Stop publisher (test offline state)
Ctrl+C

# Check logs
# Backend: Look for "📩 Received on topic..."
# Frontend Console: Look for "📡 New sensor data..."
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Always offline | Check backend is running |
| Always live | Check threshold in constants.ts |
| No change | Check browser console for errors |
| Time wrong | Sync system clock |

## Success Criteria

✅ Status changes from Live → Offline after 30s  
✅ Time ago updates every second  
✅ Connection state affects all sensors  
✅ Visual feedback is clear and animated
