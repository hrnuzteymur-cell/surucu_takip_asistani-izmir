(function(){
  'use strict';

  const hide = (el) => { if (el) { el.hidden = true; el.style.setProperty('display','none','important'); } };
  const byId = (id) => document.getElementById(id);

  function stopContinuousGps(){
    // Sürekli GPS kullanan eski özellikleri kapat. SOS'un tek seferlik getCurrentPosition çağrısına dokunma.
    try { if (typeof window.stopGps === 'function') window.stopGps(); } catch(e) {}
    try { if (typeof window.stopRideGpsTracker === 'function') window.stopRideGpsTracker(false); } catch(e) {}
    try { if (typeof window.stopRouteAdvisory === 'function') window.stopRouteAdvisory(); } catch(e) {}

    try {
      if (typeof window.gpsWatchId !== 'undefined' && window.gpsWatchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(window.gpsWatchId);
      }
    } catch(e) {}
    try {
      if (typeof window.rideGpsWatchId !== 'undefined' && window.rideGpsWatchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(window.rideGpsWatchId);
      }
    } catch(e) {}

    // Eski kod yeniden sürekli takip başlatmaya çalışırsa çalıştırma.
    window.toggleGps = function(){ return false; };
    window.startRideGpsTracker = function(){ return false; };
    window.resumeRideGpsTrackerIfNeeded = function(){ return false; };
    window.startGpsInModal = function(){ return false; };
    window.startRouteAdvisory = function(){ return false; };

    // watchPosition = sürekli konum takibi. SOS tek seferlik getCurrentPosition kullandığı için korunur.
    if (navigator.geolocation && !navigator.geolocation.__surucuGpsCleanupApplied) {
      const originalClearWatch = navigator.geolocation.clearWatch.bind(navigator.geolocation);
      try {
        navigator.geolocation.watchPosition = function(success, error){
          if (typeof error === 'function') {
            setTimeout(() => error({code:1,message:'Sürekli GPS takibi bu sürümde kaldırıldı.'}), 0);
          }
          return -1;
        };
        navigator.geolocation.clearWatch = function(id){ if (id !== -1) return originalClearWatch(id); };
        Object.defineProperty(navigator.geolocation, '__surucuGpsCleanupApplied', {value:true, configurable:false});
      } catch(e) {}
    }
  }

  function forceManualRideMode(){
    try {
      if (typeof window.rideGpsModeSelected !== 'undefined') window.rideGpsModeSelected = false;
      if (typeof window.rideGpsDistanceMeters !== 'undefined') window.rideGpsDistanceMeters = 0;
    } catch(e) {}

    const kmInput = byId('rideKm');
    if (kmInput) {
      kmInput.disabled = false;
      kmInput.readOnly = false;
    }
  }

  function hideGpsUi(){
    [
      'quickTagsimeterBtn','homeTaximeterMini','trackingView','gpsRideChoiceBtn','rideGpsPanel',
      'roadAlertsCard','roadAlertGpsToggle','autoGpsWithShiftToggle','autoGpsTransferToggle','showGpsRideOptionToggle'
    ].forEach(id => hide(byId(id)));

    document.querySelectorAll('.bottom-nav .nav[data-view="trackingView"]').forEach(hide);

    // Park sayacı kalır; yalnız GPS ile "Arabam Nerede?" kartı kaldırılır.
    const parkSection = byId('parkingSettingsSection');
    if (parkSection) parkSection.querySelectorAll('.park-location-card').forEach(hide);

    // GPS otomasyon ayarlarının bütün label satırlarını kaldır.
    ['autoGpsWithShiftToggle','autoGpsTransferToggle','showGpsRideOptionToggle'].forEach(id => {
      const input = byId(id);
      if (input) hide(input.closest('label'));
    });

    // Yardım metinlerindeki kaldırılan özellik açıklamalarını görünür arayüzden temizle.
    document.querySelectorAll('p, .help, .about-note').forEach(el => {
      const t = (el.textContent || '').toLocaleLowerCase('tr-TR');
      if (t.includes('gps ile ekle') || t.includes('tagsimetre') || t.includes('sürüş yol uyarıları')) {
        if (el.closest('#aboutView, #helpView, details')) hide(el);
      }
    });
  }

  function cleanup(){
    stopContinuousGps();
    forceManualRideMode();
    hideGpsUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cleanup, {once:true});
  else cleanup();

  window.addEventListener('load', cleanup, {once:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cleanup(); });
  new MutationObserver(cleanup).observe(document.documentElement, {childList:true, subtree:true});
})();
