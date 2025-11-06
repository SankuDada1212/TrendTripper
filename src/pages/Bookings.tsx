import { useEffect, useMemo, useState } from 'react';
import {
  bookingConfig,
  bookingFlightInfo,
  bookingCityPrice,
  bookingFlightPrice,
  bookingConfirm,
  bookingHistory,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { saveBooking, getUserBookings } from '@/lib/api';

type Vehicles = Record<string, { fare_per_km: number; icon: string; min_fare: number; platform_fee?: number }>; 

const Bookings = () => {
  const { token, isAuthenticated } = useAuth();
  
  const [config, setConfig] = useState<{
    states: Record<string, string[]>;
    vehicles: Vehicles;
    flight_cities: string[];
    places: Record<string, string[]>;
  } | null>(null);

  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [city, setCity] = useState<string>('');
  const [originPlace, setOriginPlace] = useState<string>('');
  const [destCity, setDestCity] = useState<string>('');
  const [destPlace, setDestPlace] = useState<string>('');

  const [tripType, setTripType] = useState<'city' | 'flights'>('city');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  const [flightFrom, setFlightFrom] = useState<string>('');
  const [flightTo, setFlightTo] = useState<string>('');
  const [flightInfo, setFlightInfo] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalSummary, setModalSummary] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Card' | 'Cash'>('UPI');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching booking config...');
        const cfg = await bookingConfig();
        console.log('Config received:', cfg);
        setConfig(cfg as any);
        
        // Load bookings from user's saved data if authenticated, otherwise from global history
        if (isAuthenticated && token) {
          try {
            const userBookings = await getUserBookings(token);
            setHistory((userBookings as any)?.history || []);
          } catch {
            // Fallback to global history if user bookings fail
            const h = await bookingHistory();
            setHistory((h as any)?.history || []);
          }
        } else {
          const h = await bookingHistory();
          setHistory((h as any)?.history || []);
        }
      } catch (err) {
        console.error('Error loading booking data:', err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, token]);

  const cities = useMemo(() => config?.states?.[selectedState] || [], [config, selectedState]);
  const originPlaces = useMemo(() => (city ? config?.places?.[city] || [] : []), [config, city]);
  const destinationPlaces = useMemo(() => (destCity ? config?.places?.[destCity] || [] : []), [config, destCity]);

  useEffect(() => {
    if (tripType === 'flights' && flightFrom && flightTo) {
      bookingFlightInfo({ from: flightFrom, to: flightTo }).then((res) => setFlightInfo(res));
    } else {
      setFlightInfo(null);
    }
  }, [tripType, flightFrom, flightTo]);

  const onBookNow = async () => {
    if (tripType === 'city') {
      if (!city || !originPlace || !destCity || !destPlace || !selectedVehicle) return;
      const res = await bookingCityPrice({
        city,
        origin: originPlace,
        dest_city: destCity,
        destination: destPlace,
        vehicle_name: selectedVehicle,
      });
      if ((res as any)?.error) return;
      setModalSummary(((res as any)?.summary?.text || []) as string[]);
      setModalOpen(true);
    } else {
      if (!flightFrom || !flightTo) return;
      const res = await bookingFlightPrice({ from_city: flightFrom, to_city: flightTo });
      if ((res as any)?.error) return;
      setModalSummary(((res as any)?.summary?.text || []) as string[]);
      setModalOpen(true);
    }
  };

  const onConfirmPayment = async () => {
    const res = await bookingConfirm(paymentMode);
    if ((res as any)?.saved) {
      const bookingData = (res as any).saved;
      
      // Save to user's account if authenticated
      if (isAuthenticated && token) {
        try {
          await saveBooking(token, bookingData);
        } catch (err) {
          console.error('Failed to save booking to user account:', err);
        }
      }
      
      // Update history
      if (isAuthenticated && token) {
        try {
          const userBookings = await getUserBookings(token);
          setHistory((userBookings as any)?.history || []);
        } catch {
          const h = await bookingHistory();
          setHistory((h as any)?.history || []);
        }
      } else {
        const h = await bookingHistory();
        setHistory((h as any)?.history || []);
      }
    }
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Loading booking data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-red-600">
          <p className="mb-2">Error: {error}</p>
          <p className="text-sm">Please check if the backend server is running on http://localhost:8000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-center mb-4">Trend Tripper - Mobile Booking Style</h1>

      {/* Trip Type */}
      <div className="bg-white rounded-xl p-4 shadow mb-4">
        <h3 className="text-center font-medium mb-2">Trip Type</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="tripType" checked={tripType === 'city'} onChange={() => setTripType('city')} />
            <span>🚕 City Trip (Within same city)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tripType" checked={tripType === 'flights'} onChange={() => setTripType('flights')} />
            <span>✈️ City to City Trip (Flights Only)</span>
          </label>
        </div>
      </div>

      {/* Vehicle selection */}
      {tripType === 'city' && (
        <div className="bg-white rounded-xl p-4 shadow mb-4">
          <h3 className="text-center font-medium mb-3">Choose Your Ride</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {config &&
              Object.keys(config.vehicles).map((v) => (
                <button
                  key={v}
                  className={`px-3 py-2 rounded-lg border ${selectedVehicle === v ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-100 border-transparent'}`}
                  onClick={() => setSelectedVehicle(v)}
                >
                  {`${config.vehicles[v].icon} ${v} | Rs ${config.vehicles[v].fare_per_km} per km`}
                </button>
              ))}
          </div>
          <div className="text-center mt-3 text-green-600">
            {selectedVehicle && config ? `Selected: ${config.vehicles[selectedVehicle].icon} ${selectedVehicle} | ₹${config.vehicles[selectedVehicle].fare_per_km} per km` : ''}
          </div>
        </div>
      )}

      {/* Trip Inputs */}
      <div className="bg-white rounded-xl p-4 shadow mb-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Select State</label>
            <select className="w-full border rounded p-2" value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setCity(''); setOriginPlace(''); setDestCity(''); setDestPlace(''); }}>
              {config && Object.keys(config.states).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Select City (Origin)</label>
            <select className="w-full border rounded p-2" value={city} onChange={(e) => { setCity(e.target.value); setOriginPlace(''); }}>
              <option value="" />
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Select Famous Place (Origin)</label>
            <select className="w-full border rounded p-2" value={originPlace} onChange={(e) => setOriginPlace(e.target.value)}>
              <option value="" />
              {originPlaces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Destination City</label>
            <select className="w-full border rounded p-2" value={destCity} onChange={(e) => { setDestCity(e.target.value); setDestPlace(''); }}>
              <option value="" />
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Select Famous Place (Destination)</label>
            <select className="w-full border rounded p-2" value={destPlace} onChange={(e) => setDestPlace(e.target.value)}>
              <option value="" />
              {destinationPlaces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center text-amber-600 mt-3">
          {tripType === 'flights' ? '✈️ City-to-City Trip detected! Showing available flights for your route.' : '🚕 City Trip active. Choose your ride below.'}
        </div>

        {/* Flights section */}
        {tripType === 'flights' && (
          <div className="mt-4">
            <h4 className="text-center font-medium">City-to-City Flights</h4>
            <div className="flex flex-col md:flex-row gap-2 justify-center mt-2">
              <select className="border rounded p-2 md:w-1/3" value={flightFrom} onChange={(e) => setFlightFrom(e.target.value)}>
                <option value="" disabled>Select departure city</option>
                {config?.flight_cities.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <select className="border rounded p-2 md:w-1/3" value={flightTo} onChange={(e) => setFlightTo(e.target.value)}>
                <option value="" disabled>Select destination city</option>
                {config?.flight_cities.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="mt-3 text-center">
              {!flightFrom || !flightTo ? (
                <span>Select both cities to view flight details.</span>
              ) : flightInfo?.available ? (
                <div className="space-y-1">
                  <h4>✈️ {flightFrom} → {flightTo}</h4>
                  <p>🛫 Distance: {flightInfo.distance_km} km</p>
                  <p>🕒 Duration: {flightInfo.duration}</p>
                  <p>🏢 Airline: {flightInfo.airline}</p>
                </div>
              ) : (
                <span>{flightInfo?.message || ''}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <button className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500" onClick={onBookNow}>Book Now</button>
        </div>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-xl p-4">
            <h3 className="text-lg font-medium text-center">Payment Summary</h3>
            <div className="mt-2 space-y-1">
              {modalSummary.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-sm mb-1">Select Payment Mode</label>
              <div className="space-y-1">
                {(['UPI', 'Card', 'Cash'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="radio" checked={paymentMode === m} onChange={() => setPaymentMode(m)} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-lg bg-green-600 text-white" onClick={onConfirmPayment}>Confirm Payment</button>
              <button className="px-3 py-2 rounded-lg bg-red-600 text-white" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking History */}
      <h3 className="text-lg font-medium mt-6 mb-2">Booking History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Time','Trip Type','Vehicle','From City','From Place','To City','To Place','Distance (km)','Fare per km','Final Price','Payment Mode'].map((h) => (
                <th key={h} className="px-3 py-2 border text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((b, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border text-center">{b.time}</td>
                <td className="px-3 py-2 border text-center">{b.trip_type}</td>
                <td className="px-3 py-2 border text-center">{b.vehicle}</td>
                <td className="px-3 py-2 border text-center">{b.from_city}</td>
                <td className="px-3 py-2 border text-center">{b.from_place}</td>
                <td className="px-3 py-2 border text-center">{b.to_city}</td>
                <td className="px-3 py-2 border text-center">{b.to_place}</td>
                <td className="px-3 py-2 border text-center">{b.distance}</td>
                <td className="px-3 py-2 border text-center">{b.fare}</td>
                <td className="px-3 py-2 border text-center">₹{b.final_price}</td>
                <td className="px-3 py-2 border text-center">{b.payment_mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bookings;


