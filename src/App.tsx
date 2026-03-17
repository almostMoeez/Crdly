/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CreateGreeting from './pages/CreateGreeting';
import ViewGreeting from './pages/ViewGreeting';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Crdly — Create & Share Beautiful Greeting Cards',
  '/create': 'Create a Card — Crdly',
  '/view': 'Your Greeting Card — Crdly',
};

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    document.title = ROUTE_TITLES[location.pathname] || ROUTE_TITLES['/'];
  }, [location.pathname]);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateGreeting />} />
          <Route path="/view" element={<ViewGreeting />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
