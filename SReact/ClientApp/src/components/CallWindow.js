import { React, createRef, Component } from 'react';
import * as Glob from '../script/Global';

class CallWindow extends Component {
    constructor(props) {
        //props: client
        super(props);
        this.state = {
            onCall: false/*true*/,
            participants: [],
            pagination: 1
        }
        this.roomIdRef = createRef();
        this.textRef = createRef();
        
        while (Glob.getCallWindow().length > 0)
            Glob.getCallWindow().pop();
        Glob.getCallWindow().push(this);

        this.setCall = this.setCall.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.roomTextKeyDown = this.roomTextKeyDown.bind(this);
    }

    setCall(bool) {
        this.setState({ onCall: bool });
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

    //bootstrap row?
    //each video has mute icon
    render() {
        return (
            <div id="content-container">
                {!this.state.onCall ?
                    <div id="call-outer">
                        <div className="btn btn-outline-success" onClick={() => Glob.createRoom()}>Create a room</div>
                        <div style={{ display: "inline" }}>or</div>
                        <input type="text" placeholder="Enter Room Number" ref={this.roomIdRef} />
                        <div className="btn btn-outline-primary" onClick={this.joinRoom}>Join room</div>
                    </div> :
                    <div id="full-screen">
                        <div id="call-left-side">
                            <div id="videos-container">
                                <video id="local" playsInline autoPlay></video>
                                <video id="remote" playsInline autoPlay></video>
                            </div>
                            <div id="call-btns">
                                <div className="rounded-circle">Mute</div>
                                <div className="rounded-circle">Hide camera</div>
                                <div className="rounded-circle">Raise Hand</div>
                                <div className="rounded-circle">Presentation</div>
                                <div className="rounded-circle">Hang up</div>
                            </div>
                        </div>
                        <div id="message-container">
                            <div className="pagination">
                                <div className="page-item participants-btn" onClick={() => this.setState({ pagination: 0 })}>Participants</div>
                                <div className="page-item call-chat-btn" onClick={() => this.setState({ pagination: 1 })}>Chat</div>
                            </div>
                            {this.state.pagination == 1 ?
                                <input type="text" placeholder="Chat With Others..."
                                    ref={this.textRef} onKeyDown={this.roomTextKeyDown} /> :
                                <div>
                                    {this.state.participants.map((ele) => <div>ele.contactName</div>)}
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        )
    }
}

export default CallWindow;