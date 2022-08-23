import { React, useState, useEffect } from 'react';
import { IsConfirmed, GetClientAccountInfo, LogOut } from '../script/Identity';
import $ from 'jquery';

function Account(props) {
    const client = props.client;
    const [confirmed, setConfirmed] = useState("");
    const [manageInfo, setManageInfo] = useState("");

    useEffect(() => {
        var response, json;
        if (client) {
            (async () => {
                response = await IsConfirmed();
                json = await response.json();
                setConfirmed(json);
                response = await GetClientAccountInfo();
                json = await response.json();
                setManageInfo(json);
            })();
        }
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        $.ajax({
            type: "POST",
            url: 'Identity/UpdateAccount',
            data: {
                Surname: document.getElementById('update-surname').value,
                FirstName: document.getElementById('update-firstName').value
            },
            success: function(response) { alert('Updated!'); }
        });
    }

    async function LoggingOut() {
        await LogOut();
        window.location.reload();
    }

    if (!props.client)
        return (<div />);

    return (
        <div id="account-container">
            <h1>Hello {props.client.contactName},</h1>
            <form method="post" className="account-form" onSubmit={handleSubmit}>
                <label>Surname</label>
                <input type="text" name="Surname" defaultValue={props.client.surname} className="form-control" id="update-surname" />
                <label>First Name</label>
                <input type="text" name="FirstName" defaultValue={props.client.firstName} className="form-control" id="update-firstName"/>
                <label>Email</label>
                <div>{props.client.email}</div>
                <label>Confirmed status</label>
                <div>{confirmed ? "true" : "false"}</div>
                <label>Id</label>
                <div>{props.client.id}</div>
                <label>Role</label>
                <div>{manageInfo.role}</div>
                <button type="submit" className="btn btn-success">Save changes</button>
            </form>
            <div className="btn btn-info btn-lg" onClick={LoggingOut}>Log out</div>
        </div>
    );
}

export default Account;