import { React, useState, useEffect, Component } from 'react';
import $ from 'jquery';
import * as Glob from '../../script/Global';

class FABpopup extends Component {
    constructor() {
        super();
        this.state = {
            show: false,
            notify: [],
            notSeen: 0
        }
        while (Glob.getFABpopup().length > 0)             //fast since there's 1
            Glob.getFABpopup().pop();
        Glob.getFABpopup().push(this);
        this.reload = this.reload.bind(this);
        this.show = this.show.bind(this);

        this.reload();
    }

    async reload() {
        await Glob.fetchRcvNotification();
        var count = 0;
        Glob.getRcvNotify().forEach(function (val) {
            //add code to make each click trigger 'seen'
            if (val.status == null)
                count++;
        });
        this.setState({ notify: Glob.getRcvNotify() });
        this.setState({ notSeen: count });
    }

    async show() {
        //instead of css - hidden
        if (!this.state.show)
            this.reload();
        this.setState({ show: !this.state.show });
    }

    render() {
        return (
            <div>
                <div className="btn btn-primary" id="fab" onClick={Glob.showNotifications}>
                    <i className="fa fa-bars"></i>
                </div>
                { this.state.notSeen > 0 ? <div id="fab-not-seen">{this.state.notSeen}</div> : <div /> }
                <div id="fab-popup">
                    {this.state.show ?
                        <div id="fab-content">
                            <div id="fab-header">Notifications</div>
                            {this.state.notify.length > 0 ?
                                this.state.notify.map((ele) => <NotifyItem key={ele.notificationId} notify={ele} />) :
                                <div>You don't have any notifications.</div>}
                        </div> :
                        <div />}
                </div>
            </div>
        )
    }
}

export default FABpopup;
        
function NotifyItem(props) {
    const [hasBtn, setHasBtn] = useState(false);
    var time = Glob.toClientTime(props.notify.time);

    useEffect(() => {
        if (props.notify.type === 'friend' && !props.notify.status)
            setHasBtn(true);
    }, [])

    function clickNotify() {
        //seen
        Glob.showProfile(props.notify.sender);
    }

    function confirmNotify(e) {
        e.stopPropagation();
        $.post('Chat/UpdateNotification?id=' + props.notify.notificationId + '&confirm=true', async function () {
            await Glob.fetchRcvNotification();
            //isFriend is not updated
        });
        setHasBtn(false);
    }

    function deleteNotify(e) {
        e.stopPropagation();
        $.post('Chat/DeleteNotification?id=' + props.notify.notificationId, async function () {
            await Glob.fetchRcvNotification();
        });
        setHasBtn(false);
    }

    return (
        <div className="notify-item" onClick={clickNotify}>
            <div className="notify-avatar">
                <img src={props.notify.sender.avatar} alt="" className="avatar" />
            </div>
            <div className="notify-msg">
                <p>{props.notify.message}</p>
                <p style={{ "fontSize": "10px" }}>{time}</p>
                {hasBtn ?
                    <div className="notify-btns">
                        <div className="btn notify-confirm" onClick={confirmNotify}>Confirm</div>
                        <div className="btn notify-delete" onClick={deleteNotify}>Delete</div>
                    </div> :
                    <div />}
            </div>
        </div>
    );
}