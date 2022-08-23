import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import registerServiceWorker from './registerServiceWorker';
import App from './App';
import IsLoggedIn from './script/Identity';
import Login from './components/separate/login';
import NotFound from './components/separate/404';
import './index.css';



const root = ReactDOM.createRoot(document.getElementById('root'));
var response, json;

const init = async () => {
    response = await IsLoggedIn();
    json = await response.json();
}
init().then(() => {
    root.render(
        <Router>
            <Routes>
                {["/", "/home", "/friends", "/settings", "/profile"].map((path) =>
                    <Route key="home" path={path} element={json ? <App path={path} /> : <Login />} />
                )}
                <Route key="login" exact path="/Login" element={<Login />} />
                <Route key="notFound" path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );}
);



//Edited - Not Original create-react-app
registerServiceWorker();