import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type SystemStatus = 'ok' | 'warn' | 'crit';

export interface MissionData {
  missionName:       string;
  destination:       string;
  status:            string;
  metSeconds:        number;
  fuelPercent:       number;
  batteryPercent:    number;
  signalPercent:     number;
  tempInternal:      number;
  tempExternal:      number;
  cabinPressure:     number;
  distanceFromEarth: number;
  velocityKms:       number;
  latencyMin:        number;
  signalDbm:         number;
  signalBars:        number;
  uplinkActive:      boolean;
  orbitInclination:  number;
  orbitAltitudeKm:   number;
  orbitPeriodMin:    number;
  orbitEccentricity: number;
  deltaVAvailable:   number;
  orbitStable:       boolean;
  shipAngle:         number;
  systems: {
    propulsion: SystemStatus;
    power:      SystemStatus;
    comms:      SystemStatus;
    navigation: SystemStatus;
    thermal:    SystemStatus;
    structural: SystemStatus;
  };
  alerts: string[];
}

const INITIAL: MissionData = {
  missionName:       'ARES-VII // MISSÃO MARTE',
  destination:       'MARTE',
  status:            'EM ÓRBITA',
  metSeconds:        142 * 86400 + 8 * 3600 + 33 * 60,
  fuelPercent:       18,
  batteryPercent:    87,
  signalPercent:     62,
  tempInternal:      22,
  tempExternal:      -187,
  cabinPressure:     1.02,
  distanceFromEarth: 78.4,
  velocityKms:       24.7,
  latencyMin:        4.3,
  signalDbm:         62,
  signalBars:        4,
  uplinkActive:      true,
  orbitInclination:  28.5,
  orbitAltitudeKm:   320,
  orbitPeriodMin:    128,
  orbitEccentricity: 0.0012,
  deltaVAvailable:   48,
  orbitStable:       true,
  shipAngle:         -Math.PI / 2,
  systems: {
    propulsion: 'ok',
    power:      'ok',
    comms:      'warn',
    navigation: 'ok',
    thermal:    'crit',
    structural: 'ok',
  },
  alerts: [
    'Temperatura externa: -187°C — CRÍTICO',
    'Combustível em 18% — nível baixo',
    'Sinal de comunicação fraco',
  ],
};

interface ContextValue {
  mission:       MissionData;
  updateMission: (patch: Partial<MissionData>) => void;
  dismissAlert:  (index: number) => void;
}

const MissionContext = createContext<ContextValue>({
  mission:       INITIAL,
  updateMission: () => {},
  dismissAlert:  () => {},
});

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [mission, setMission] = useState<MissionData>(INITIAL);

  const metRef    = useRef(INITIAL.metSeconds);
  const distRef   = useRef(INITIAL.distanceFromEarth);
  const signalRef = useRef(INITIAL.signalBars);
  const angleRef  = useRef(INITIAL.shipAngle);

  useEffect(() => {
    const interval = setInterval(() => {
      metRef.current   += 1;
      angleRef.current += 0.008;

      if (metRef.current % 2 === 0) {
        distRef.current = parseFloat(
          Math.max(0, distRef.current + (Math.random() - 0.45) * 0.02).toFixed(1)
        );
      }

      if (metRef.current % 3 === 0) {
        const delta = Math.random() > 0.5 ? 1 : -1;
        signalRef.current = Math.max(2, Math.min(7, signalRef.current + delta));
      }

      setMission(prev => ({
        ...prev,
        metSeconds:        metRef.current,
        distanceFromEarth: distRef.current,
        signalBars:        signalRef.current,
        shipAngle:         angleRef.current,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateMission = (patch: Partial<MissionData>) =>
    setMission(prev => ({ ...prev, ...patch }));

  const dismissAlert = (index: number) =>
    setMission(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index),
    }));

  return (
    <MissionContext.Provider value={{ mission, updateMission, dismissAlert }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  return useContext(MissionContext);
}