import {Routes, Route } from 'react-router-dom';
import Home from '../views/Home';
import Menu from '../views/Menu';
import Orders from '../views/Orders';
import Kitchen from '../views/Kitchen';
import Dashboard from '../views/Dashboard';

function AppRouter() {
    return(
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/menu' element={<Menu />} />
            <Route path='/orders' element={<Orders />} />
            <Route path='/kitchen' element={<Kitchen />} />
            <Route path='/dashboard' element={<Dashboard />} />
        </Routes>
    )
}

export default AppRouter