import React from 'react';
import { Link } from 'react-router-dom';

function Nav(props) {
    //? link cause connection to reset?
    return (
        <div id="nav">
            <ul className="nav navbar-nav">
                <li className="nav-item" >
                    <Link to={'/home'}>
                        <i className="far fa-comments" style={{ fontSize: "32px" }}></i>
                    </Link>
                </li>
                <li className="nav-item" >
                    <Link to={'/friends'}>
                        <i className="far fa-address-book" style={{ fontSize: "32px" }}></i>
                    </Link>
                </li>
                <li className="nav-item" >
                    <Link to={'/settings'}>
                        <i className="fa fa-cogs" style={{ fontSize: "32px" }}></i>
                    </Link>
                </li>
                <li className="nav-item" >
                    <Link to={'/profile'} id="nav-avatar">
                        <img src={props.client.avatar} alt="" className="avatar" />
                    </Link>
                </li>
            </ul>
        </div>
    );
}

export default Nav;