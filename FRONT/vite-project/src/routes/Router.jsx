import React, { Suspense, lazy } from 'react';
import {Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('../views/Home'))
const Menu = lazy(() => import('../views/Menu'))
const Orders = lazy(() => import('../views/Orders'))
const Kitchen = lazy(() => import('../views/Kitchen'))
const Dashboard = lazy(() => import('../views/Dashboard'))

function AppRouter() {
    return(
        <Suspense fallback={  <div className="flex flex-col items-center justify-center h-screen fondoRojo text-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-lg font-semibold">Cargando vista...</p></div>}>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/menu' element={<Menu />} />
                <Route path='/orders' element={<Orders />} />
                <Route path='/kitchen' element={<Kitchen />} />
                <Route path='/dashboard' element={<Dashboard />} />
            </Routes>
        </Suspense>
    )
}

export default AppRouter;
