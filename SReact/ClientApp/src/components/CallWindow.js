import { React, createRef, Component } from 'react';
import { Message } from './home/messageBox';
import * as Glob from '../script/Global';

class CallWindow extends Component {
    constructor(props) {
        //props: client
        super(props);
        this.state = {
            onCall: false/*true*//*test*/,
            participants: [],
            pagination: 1,
            roomId: "",
            messages: []
        }
        this.roomIdRef = createRef();
        this.textRef = createRef();
        
        while (Glob.getCallWindow().length > 0)
            Glob.getCallWindow().pop();
        Glob.getCallWindow().push(this);

        this.setCall = this.setCall.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.roomTextKeyDown = this.roomTextKeyDown.bind(this);
        this.hangUp = this.hangUp.bind(this);
    }

    setCall(id) {
        if (typeof id == "string")
            this.setState({ onCall: true, roomId: id });
    }

    joinRoom() {
        var message = this.roomIdRef.current.value;
        if (message.value != '')
            Glob.joinRoom(message);
        this.roomIdRef.current.value = "";
    }

    roomTextKeyDown(e) {
        if (e.key === 'Enter') {
            var message = this.roomRef.current.value;
            Glob.sendRoom(1, message);
            this.roomRef.current.value = "";
        }
    }

    hangUp() {
        //reset state
        this.setState({ onCall: false, participants: [], pagination: 1, roomId: "", messages: [] });
        Glob.leaveCall();
    }

    //bootstrap row?
    //each video has mute icon
    render() {
        if (!this.state.onCall)
            return (
                <div id="content-container">
                    <div id="call-outer">
                        <div className="btn btn-outline-success f-left" onClick={() => Glob.createRoom()}>Create a room</div>
                        <div style={{ display: "inline" }}>or</div>
                        <input type="text" placeholder="Enter Room Id" ref={this.roomIdRef} />
                        <div className="btn btn-outline-primary f-right" onClick={this.joinRoom}>Join room</div>
                    </div>
                </div>
            );
        else
            return (
                <div id="full-screen">
                    <div id="call-left-side">
                        <div id="videos-container">
                            <video id="local" playsInline autoPlay></video>
                            <video id="remote" playsInline autoPlay></video>
                        </div>
                        <div id="call-btns-container">
                            <div id="call-btns">
                                <div><i className="fa fa-volume-xmark"></i>{/*mute*/}</div>
                                <div><i className="fa fa-eye-slash"></i>{/*hide camera*/}</div>
                                <div><i className="fa fa-hand"></i>{/*raise hand*/}</div>
                                <div><i className="fa fa-arrow-up-from-bracket"></i>{/*presentation*/}</div>
                                <div onClick={this.hangUp}><i className="fa fa-phone-slash"></i></div>
                                {/*invite friends*/}
                            </div>
                        </div>
                    </div>
                    <div id="call-right-side">
                        <div>Room ID : {this.state.roomId}</div>
                        <div className="pagination">
                            <div className="page-item btn btn-link participants-btn" onClick={() => this.setState({ pagination: 0 })}>Participants</div>
                            <div className="page-item btn btn-link call-chat-btn" onClick={() => this.setState({ pagination: 1 })}>Chat</div>
                        </div>
                        {this.state.pagination == 1 ?
                            <div className="room-chat-container">
                                <div className="room-chat-body">
                                    {this.state.messages.map((rcd) =>
                                        /*props?*/
                                        <Message key={rcd.chatRecordId} chatRecord={rcd} userMail={this.state.userMail} targetMail={this.props.info.email} />
                                    )}
                                </div>
                                <input type="text" placeholder="Chat With Others..." ref={this.textRef} onKeyDown={this.roomTextKeyDown} />
                            </div> :
                            <div>
                                {this.state.participants.map((ele) =>
                                    <div key={ele.contactName}>ele.contactName</div>
                                )}
                            </div>
                        }
                    </div>
                </div>
            );
    }
}

export default CallWindow;