import {Routes, Route } from 'react-router-dom';
import Home from '../views/Home';
import Menu from '../views/Menu'

function AppRouter() {
    return(
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/menu' element={<Menu />} />
            <Route path='/orders' element={< orders/>} />
        </Routes>
    )
}

export default AppRouter