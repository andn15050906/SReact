import { React, Component, createRef } from 'react';
import $ from 'jquery';
import * as Glob from '../../script/Global';

/*MessageBox, Message*/

class MessageBox extends Component {
    constructor(props) {
        super(props);                           //props: info
        this.state = {
            userMail: {},
            messages: [],
            minimized: false,
            emojiOpen: false,
            addedEmojiEvent: false
        }
        this.state.userMail = Glob.getUserMail();

        this.minimize = this.minimize.bind(this);
        this.upload = this.upload.bind(this);
        this.emote = this.emote.bind(this);
        this.emojiPick = this.emojiPick.bind(this);
        this.messagingKeyDown = this.messagingKeyDown.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendFile = this.sendFile.bind(this);

        this.textRef = createRef();
        this.bodyRef = createRef();
        this.fileRef = createRef();
        this.emojiRef = createRef();
        var available = Glob.getOpeningBoxs();
        if (available.find(ele => ele.props === this.props) !== -1)
            Glob.getOpeningBoxs().push(this);
    }

    async fetchMsg(mail) {
        return $.get(
            'Chat/GetChatRecords?mail1=' + mail + '&mail2=' + this.props.info.email,
            function (response) { return response; }
        );
    }

    minimize() {
        this.setState({ minimized: !this.state.minimized });
    }

    upload() {
        this.fileRef.current.click();
    }

    emote() {
        this.setState({ emojiOpen: !this.state.emojiOpen });
    }

    emojiPick(e) {
        this.textRef.current.value = this.textRef.current.value + e.detail.unicode;
    }

    messagingKeyDown(e) {
        if (e.key === 'Enter')
            this.sendMessage();
    }

    sendMessage() {
        var message = this.textRef.current.value;
        if (message !== "") {
            Glob.sendPrivate(this.props.info.email, message, "text");
        }
        this.textRef.current.value = "";
    }

    sendFile() {
        var file = this.fileRef.current.files[0];
        if (file) {
            Glob.sendFilePrivate(this.props.info.email, file);
        }
    }

    componentDidMount() {
        this.fetchMsg(this.state.userMail).then((res) => {
            this.setState({ messages: res });
        });
        if (this.bodyRef.current != null)
            this.bodyRef.current.scrollTop = this.bodyRef.current.scrollHeight;
        if (!this.state.addedEmojiEvent) {
            this.setState({ addedEmojiEvent: true });
            this.emojiRef.current.addEventListener('emoji-click', event => this.emojiPick(event));
        }
    }

    //2 '?' to avoid creating a new div
    render() {
        return (
            <div className={this.state.minimized === false ? "message-box" : "message-box minimized"}>
                <div className="chat-header">
                    <div className="chat-dropdown hover-ptr">
                        <img className="avatar" src={this.props.info.avatar} alt="" onClick={() => Glob.showProfile(this.props.info)} />
                        <div className="chat-name">{this.props.info.contactName}</div>
                    </div>
                    <div className="chat-btn-lst hover-ptr">
                        <i className="la la-minus" onClick={this.minimize}></i>
                        <i className="la la-times close" onClick={() => Glob.closeChat(this.props.info)}></i>
                    </div>
                </div>
                {this.state.minimized === false ?
                    <div className="chat-body" ref={this.bodyRef}>
                        {this.state.messages.map((rcd) =>
                            <Message key={rcd.chatRecordId} chatRecord={rcd} userMail={this.state.userMail} targetMail={this.props.info.email} />
                        )}
                    </div> :
                    <div></div>}
                {this.state.minimized === false ?
                    <div className="chat-footer">
                        <i className="far fa-image" onClick={this.upload} ></i>
                        <input type="text" placeholder="your message here..." ref={this.textRef} onKeyDown={this.messagingKeyDown} />
                        <i className="fa-regular fa-face-smile" onClick={this.emote} ></i>
                        <i className="fa-regular fa-paper-plane" onClick={this.sendMessage} ></i>
                        <input className="hidden" type="file" ref={this.fileRef} onChange={this.sendFile} />
                        <emoji-picker ref={this.emojiRef} class={this.state.emojiOpen ? "normal-picker" : "hidden-picker"}></emoji-picker>
                    </div> :
                    <div></div>}
            </div>
        );
    }
}

export default MessageBox;

function Message(props) {
    var record = props.chatRecord;
    var option = (record.sender.email === props.userMail) ? 'send' : 'receive';
    var type = record.file ? 'file' : 'text';

    var content, time;
    if (!record.message && !record.file) {
        //record is a string -> send to self
        content = record;
        var d = new Date();
        time = d.getDate() + "-" + d.getMonth() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    }
    else {
        content = record.message;
        if (type === 'file')
            content = record.file;
        time = Glob.toClientTime(record.time);
    }

    function deleteMsg() {
        Glob.setTargetMsg(record.chatRecordId, props.targetMail);
        Glob.setRmvMsgModal(true);
    }

    /*
    <msg-line>
        innerHTML
        <mainMsg />
        <msgTime>innerHTML</msgTime>
        <msgRmv />
    </msg-line>
    */
    if (option === 'send')
        return (
            <div className="msg-line self">
                <div className="msg-block">
                    <div className="msg-rmv" onClick={deleteMsg}>
                        <i className="la la-times close"></i>
                    </div>
                    <MsgContent type={type} content={content} time={time} />
                </div>
            </div>
        );
    else
        return (
            <div className="msg-line other">
                <img className="avatar" src={record.sender.avatar} alt="" />
                <div className="msg-block">
                    <MsgContent type={type} content={content} time={time} />
                    {/*...*/}
                </div>
            </div>
        );
}

function MsgContent(props) {
    var type = props.type;
    var content = props.content;
    var time = props.time;
    var extension = content.split('.').pop();

    if (type === 'text')
        return (
            <div className="msg-txt">
                {content}
                <div className="msg-time">{time}</div>
            </div>
        );
    else if (type === 'file') {
        if (extension !== 'png' && extension !== 'jpg')
            return (
                <a className="msg-file" href={"/upload-chat/" + content} >
                    {content.substring(content.lastIndexOf('\\') + 1)}
                    <i className="fas fa-file"></i>
                    <div className="msg-time">{time}</div>
                </a>
            );
        else
            return (
                <div className="msg-img">
                    <img src={"/upload-chat/" + content} alt="" />
                    <div className="msg-time">{time}</div>
                </div>
            );
    }
    else
        return (<div></div>);
}