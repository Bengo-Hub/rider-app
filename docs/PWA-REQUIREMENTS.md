# Rider App - PWA Requirements

## Overview

The Rider App is a Progressive Web Application (PWA) designed for delivery riders/drivers to manage deliveries, track routes, and update order status. It must provide a native app-like experience with offline support, push notifications for new orders, and GPS tracking capabilities.

---

## PWA Core Requirements

### 1. Installation Prompt

**Auto-prompt Strategy**:
- Trigger install prompt immediately on first visit (critical for riders)
- Show persistent install banner for uninstalled users
- Clear "Install App" call-to-action

**Install Criteria**:
- User visits site (immediate prompt)
- User is on mobile device
- Browser supports PWA installation

**Implementation**:
```typescript
// Immediate install prompt for riders
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show persistent install banner
  showInstallBanner({
    title: 'Install Rider App',
    message: 'Get instant notifications for new orders',
    persistent: true,
  });
});
```

---

### 2. Web App Manifest

**Manifest Configuration**:
```json
{
  "name": "Urban Loft - Rider App",
  "short_name": "Rider App",
  "description": "Manage deliveries, track routes, and earn with Urban Loft",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF6B35",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/rider-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/rider-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Active Deliveries",
      "short_name": "Deliveries",
      "description": "View active delivery tasks",
      "url": "/tasks/active",
      "icons": [{ "src": "/icons/delivery-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Earnings",
      "short_name": "Earnings",
      "description": "View daily earnings",
      "url": "/earnings/today",
      "icons": [{ "src": "/icons/earnings-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["business", "productivity", "navigation"],
  "prefer_related_applications": false
}
```

---

### 3. Service Worker & Caching

**Caching Strategies**:

1. **Static Assets** (Cache First):
   - Images, CSS, JS bundles
   - Map tiles (for offline viewing)

2. **Task Data** (Network First):
   - Active delivery tasks
   - Task details
   - Try network first, cache fallback

3. **Route Data** (Network Only):
   - Real-time navigation
   - Live location updates
   - No caching

4. **Earnings Data** (Stale While Revalidate):
   - Daily/weekly earnings
   - Cache for 5 minutes

**Service Worker Implementation**:
```typescript
// Cache map tiles for offline viewing (self-hosted TileServer-GL)
registerRoute(
  ({ url }) => url.origin === 'https://tiles.codevertexitsolutions.com',
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 86400, // 24 hours
      }),
    ],
  })
);

// Network-first for tasks
registerRoute(
  ({ url }) => url.pathname.includes('/api/v1/') && url.pathname.includes('/tasks'),
  new NetworkFirst({
    cacheName: 'tasks-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 300, // 5 minutes
      }),
    ],
  })
);
```

---

### 4. Offline Support

**Offline Features**:
- ✅ View cached task details
- ✅ View cached earnings
- ✅ View cached route (last known)
- ⚠️ Cannot accept new tasks (requires network)
- ⚠️ Cannot update task status (requires network)
- ⚠️ Cannot send location updates (requires network)

**Offline Queue**:
```typescript
// Queue task status updates for when online
const queueTaskUpdate = async (taskId: string, status: string, metadata?: any) => {
  const pendingUpdates = JSON.parse(localStorage.getItem('pendingTaskUpdates') || '[]');
  
  pendingUpdates.push({
    id: generateId(),
    taskId,
    status,
    metadata,
    timestamp: Date.now(),
  });
  
  localStorage.setItem('pendingTaskUpdates', JSON.stringify(pendingUpdates));
  
  // Try to sync immediately
  await syncPendingUpdates();
};

// Sync when back online
const syncPendingUpdates = async () => {
  const pendingUpdates = JSON.parse(localStorage.getItem('pendingTaskUpdates') || '[]');
  
  for (const update of pendingUpdates) {
    try {
      await updateTaskStatus(update.taskId, update.status, update.metadata);
      removePendingUpdate(update.id);
    } catch (error) {
      console.error('Failed to sync task update:', error);
    }
  }
};
```

---

### 5. Push Notifications

**Critical Notifications** (High Priority):
- New delivery task assigned
- Task cancellation
- Urgent customer request

**Notification Types**:
- Task assignment (sound + vibration)
- Task updates (customer changed address, etc.)
- Earnings updates (daily summary)
- System alerts (shift reminders, etc.)

**Push Notification Setup**:
```typescript
// Request notification permission (critical for riders)
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await subscribeToPushNotifications();
      trackNotificationPermission('granted');
    } else {
      // Show critical message for riders
      showCriticalMessage(
        'Notifications are required to receive delivery tasks. Please enable notifications.'
      );
    }
  }
};

// Handle push notifications in service worker
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body,
    icon: '/icons/rider-icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data.data,
    tag: data.tag,
    requireInteraction: data.requireInteraction || true, // Require interaction for tasks
    vibrate: data.vibrate || [200, 100, 200],
    sound: data.sound || '/sounds/notification.mp3',
    actions: data.actions || [
      { action: 'accept', title: 'Accept' },
      { action: 'reject', title: 'Reject' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification actions (Accept/Reject task)
self.addEventListener('notificationclick', async (event) => {
  event.notification.close();
  
  if (event.action === 'accept') {
    const taskId = event.notification.data?.taskId;
    await acceptTask(taskId);
    event.waitUntil(clients.openWindow(`/tasks/${taskId}`));
  } else if (event.action === 'reject') {
    const taskId = event.notification.data?.taskId;
    await rejectTask(taskId);
  } else {
    // Default click - open task details
    const urlToOpen = event.notification.data?.url || '/tasks';
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});
```

---

### 6. GPS & Location Tracking

**Background Location Updates**:
- Continuous location tracking while on shift
- Send location updates to logistics-service every 10-30 seconds
- Works in background when app is minimized

**Implementation**:
```typescript
// Request background location permission
const requestLocationPermission = async () => {
  if ('geolocation' in navigator) {
    try {
      const position = await getCurrentPosition();
      await enableBackgroundLocation();
    } catch (error) {
      showError('Location permission is required for delivery tracking');
    }
  }
};

// Background location tracking
let locationWatchId: number | null = null;

const startLocationTracking = () => {
  if ('geolocation' in navigator) {
    locationWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        
        // Send to logistics-service
        await sendLocationUpdate(location);
        
        // Store locally for offline sync
        await storeLocationUpdate(location);
      },
      (error) => {
        console.error('Location error:', error);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      }
    );
  }
};

const stopLocationTracking = () => {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
};

// Send location update to backend
const sendLocationUpdate = async (location: Location) => {
  try {
    await fetch(`${LOGISTICS_API}/v1/${tenantSlug}/riders/${riderId}/location`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
    });
  } catch (error) {
    // Queue for retry
    await queueLocationUpdate(location);
  }
};
```

**Background Sync** (Service Worker):
```typescript
// Sync location updates in background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location-updates') {
    event.waitUntil(syncQueuedLocationUpdates());
  }
});

const syncQueuedLocationUpdates = async () => {
  const queuedUpdates = await getQueuedLocationUpdates();
  
  for (const update of queuedUpdates) {
    try {
      await sendLocationUpdate(update);
      await removeQueuedLocationUpdate(update.id);
    } catch (error) {
      console.error('Failed to sync location update:', error);
    }
  }
};
```

---

### 7. Mobile-First Design

**Key Mobile Considerations**:
- Large, touch-friendly buttons (min 48x48px)
- One-handed operation (bottom action buttons)
- Clear status indicators (task status, earnings)
- Fast task acceptance/rejection
- Quick access to navigation (self-hosted Valhalla routing via logistics-api, rendered with @bengo-hub/maps / MapLibre GL JS)

**Performance Targets**:
- Task acceptance: < 2 seconds
- Location update latency: < 5 seconds
- App launch: < 2 seconds
- Smooth map rendering (60fps)

---

## Testing Checklist

### Installation
- ✅ Install prompt appears immediately
- ✅ App installs correctly
- ✅ App opens in standalone mode
- ✅ App icon appears on home screen

### Notifications
- ✅ Push notifications received for new tasks
- ✅ Notification actions (Accept/Reject) work
- ✅ Sound and vibration work
- ✅ Notification badge updates

### Location Tracking
- ✅ Location permission request works
- ✅ Location updates sent to backend
- ✅ Background location tracking works
- ✅ Offline location queue syncs when online

### Offline Functionality
- ✅ Cached task details load offline
- ✅ Task updates queue for sync
- ✅ Location updates queue for sync

---

## References

- [Logistics Service Plan](../../logistics-api/plan.md)
- [PWA Best Practices](https://web.dev/pwa/)
- [Background Location API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

