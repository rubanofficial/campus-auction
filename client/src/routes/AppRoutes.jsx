import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Auctions from '../pages/Auctions';
import CreateAuction from '../pages/CreateAuction';
import AuctionDetails from '../pages/AuctionDetails';
import MyActivity from '../pages/MyActivity';
import Notifications from '../pages/Notifications';
import NotFound from '../pages/NotFound';

/**
 * Main application routing configuration
 * Notice: /auctions/create is declared before /auctions/:id to ensure proper match priority.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auctions" element={<Auctions />} />
      <Route path="/auctions/create" element={<CreateAuction />} />
      <Route path="/auctions/:id" element={<AuctionDetails />} />
      <Route path="/activity" element={<MyActivity />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
