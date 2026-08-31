'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image files by relative path,
// which breaks under Next.js's bundler. Building a simple custom pin
// instead avoids that entirely, and lets it match the brand colour.
const pinIcon = new L.DivIcon({
  html: `<div style="
    width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
    background: #392061; transform: rotate(-45deg);
    border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.35);
  "></div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

// Victoria-wide view, centred roughly on Melbourne
const VIC_CENTER = [-37.85, 144.98];
const VIC_ZOOM = 11;

export default function PractitionerMap({ practitioners, onBook }) {
  return (
    <div style={{ height: 440, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--line)' }}>
      <MapContainer center={VIC_CENTER} zoom={VIC_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {practitioners.filter((p) => p.lat && p.lng).map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon}>
            <Popup>
              <div style={{ fontFamily: 'Karst, sans-serif', minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B5F7A', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B5F7A', marginBottom: 8 }}>{p.suburb}</div>
                <button
                  onClick={() => onBook(p)}
                  style={{
                    background: '#392061', color: '#fff', border: 'none', borderRadius: 6,
                    padding: '0.4rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer', width: '100%',
                  }}
                >
                  Book consultation
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
