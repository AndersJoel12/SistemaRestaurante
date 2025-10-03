import {Routes, Route } from 'react-router-dom';
import Home from '../views/Home';
import Menu from '../views/Menu';
/* import Orders from '../views/Orders'; */

function AppRouter() {
    return(
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/menu' element={<Menu />} />
 {/*            <Route path='/orders' element={<Orders />} /> */}
        </Routes>
    )
}

export default AppRouter