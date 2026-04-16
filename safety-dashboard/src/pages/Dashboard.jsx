import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import { junctions } from '../data/junctions';

export default function Dashboard() {
  const [selectedJunction, setSelectedJunction] = useState(null);

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-slate-950">
      <Sidebar 
        junctions={junctions} 
        onSelectJunction={setSelectedJunction} 
      />
      <main className="flex-1 h-full w-full relative">
        <MapComponent 
          junctions={junctions}
          selectedJunction={selectedJunction}
          onSelectJunction={setSelectedJunction}
        />
      </main>
    </div>
  );
}
