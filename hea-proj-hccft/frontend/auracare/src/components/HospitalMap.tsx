import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Phone, Star, Building2, Map as MapIcon, Layers } from 'lucide-react';
import { NearbyHospital } from '../lib/api';
import { Button } from './ui/button';

declare global {
  interface Window {
    L: any;
  }
}

interface HospitalMapProps {
  hospitals: NearbyHospital[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  userLocation?: { lat: number; lng: number };
}

export function HospitalMap({ hospitals, selectedId, onSelect, userLocation }: HospitalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);


  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https:
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https:
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);


  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !window.L) return;

    if (!leafletMap.current) {
      const center = userLocation ? [userLocation.lat, userLocation.lng] : [28.5672, 77.2100];
      leafletMap.current = window.L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, 13);

      window.L.tileLayer('https:
        maxZoom: 19,
      }).addTo(leafletMap.current);

      window.L.control.zoom({ position: 'topright' }).addTo(leafletMap.current);
    }
  }, [leafletLoaded, userLocation]);


  useEffect(() => {
    if (!leafletMap.current || !window.L) return;


    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];


    if (userLocation) {
      const userMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: "#3b82f6",
        color: "#fff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }).addTo(leafletMap.current)
        .bindPopup("Your Location");
      markersRef.current.push(userMarker);
    }


    hospitals.forEach(h => {
      const isSelected = h.id === selectedId;
      const marker = window.L.marker([h.latitude, h.longitude], {
        icon: window.L.divIcon({
          className: 'custom-div-marker',
          html: `<div style="background-color: ${isSelected ? '#2563eb' : '#ef4444'}; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(leafletMap.current);

      marker.on('click', () => onSelect(h.id));
      markersRef.current.push(marker);

      if (isSelected) {
        leafletMap.current.flyTo([h.latitude, h.longitude], 15, { animate: true, duration: 1 });
      }
    });


    if (hospitals.length > 0 && !selectedId) {
      const group = new window.L.featureGroup(markersRef.current);
      leafletMap.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

  }, [hospitals, selectedId, userLocation]);

  return (
    <div className="w-full h-full relative border-l border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {}
      <div className="absolute bottom-6 left-6 right-6 z-[1000]">
        <AnimatePresence>
          {selectedId && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 30 }}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-lg mx-auto"
            >
              {(() => {
                const h = hospitals.find(h => h.id === selectedId);
                if (!h) return null;
                return (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate">{h.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-bold text-blue-600 uppercase tracking-tighter">{h.available_beds} Beds Free</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {h.rating}</span>
                      </div>
                    </div>
                    <Button className="rounded-full bg-blue-600 text-white px-6 h-10 shadow-lg hover:bg-blue-700">Directions</Button>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!leafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Initializing Map...</p>
        </div>
      )}
    </div>
  );
}
