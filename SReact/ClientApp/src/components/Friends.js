import { React, useEffect, useState } from 'react';
import ProfilePage from '../components/home/profilePage';
import * as Glob from '../script/Global';
import $ from 'jquery';

function FriendWindow(props) {
    const [friends, setFriends] = useState([]);
    const [profileState, setProfileState] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        (async () => {
            var mail, response, json;
            await $.get("/Identity/GetMail", function (res) { mail = res; });
            response = await Glob.fetchFriends(mail);
            json = await response.json();
            setFriends(json);
        })();
    }, [])

    function showProfile(profile) {
        setProfile(profile);
        setProfileState(true);
    }

    return (
        <div id="content-container">
            {!profileState ? friends.map((ele) =>
                <div key={ele.email}>
                    <img className="avatar" src={ele.avatar} alt="" onClick={() => showProfile(ele)} />
                    {ele.contactName}
                </div>) :
                <ProfilePage profile={profile} />}
        </div>
    );
}

export default FriendWindow;