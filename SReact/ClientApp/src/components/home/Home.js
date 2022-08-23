import { React, useState, useEffect, Component } from 'react';
import $ from 'jquery';
import { Modal } from 'react-bootstrap';

import FABpopup from './homeGadgets';
import ProfilePage from './profilePage';
import MessageBox from './messageBox';
import * as Glob from '../../script/Global';

class Home extends Component {
    constructor(props) {
        super(props);
        //called once
        //props not set here
        this.state = {
            profile: this.props.client,
            contactLst: [],
            rmvMsg: false
        }
        while (Glob.getHome().length > 0)             //fast since there's 1
            Glob.getHome().pop();
        Glob.getHome().push(this);
        this.setProfile = this.setProfile.bind(this);
        this.closeChat = this.closeChat.bind(this);
        this.removeMsgModal = this.removeMsgModal.bind(this);
    }

    async setProfile(_profile) {
        var fullProfile = this.state.contactLst.find(ele => ele.email === _profile.email);
        if (!fullProfile) {
            //if is not full -> fetch
            if (!_profile.contactName) {
                await $.get("Chat/GetInfo?email=" + _profile.email, function (res) {
                    fullProfile = res;
                });
            }
            //if full or couldn't fetch
            if (!fullProfile)
                fullProfile = _profile;
            if (fullProfile.email !== this.props.client.email)
                this.state.contactLst.push(fullProfile);
        }
        //set as profile
        this.setState({ profile: fullProfile });
    }

    closeChat(_profile) {
        this.setState({ contactLst: this.state.contactLst.filter(item => item !== _profile) });
    }

    //re-create chat-area so that changes are minimum?
    removeMsgModal(bool) {
        this.setState({ rmvMsg: bool });
    }

    render() {
        return (
            <div id="content-container">
                <Contact client={this.props.client} />
                <div id="board">
                    <FABpopup />
                    <ProfilePage profile={this.state.profile} />
                </div>
                <div id="boxs-wrapper">
                    {this.state.contactLst.map((contact) =>
                        <MessageBox key={contact.email} info={contact} />
                    )}
                    <Modal show={this.state.rmvMsg}>
                        <Modal.Header>
                            <Modal.Title>Remove this message?</Modal.Title>
                        </Modal.Header>
                        <Modal.Footer>
                            <div className="btn btn-danger" onClick={() => { this.setState({ rmvMsg: false }); Glob.deleteMsg(); }}>Remove</div>
                            <div className="btn btn-primary" onClick={() => { this.setState({ rmvMsg: false }); }}>Cancel</div>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        );
    }
}

export default Home;

function Contact(props) {
    //hold only recent contacts
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        var response, json;
        (async () => {
            response = await fetch("/Chat/GetOtherChatUsers");
            json = await response.json();
            await setContacts(json);
        })()
    }, [contacts.length]);

    return (
        <div id="contacts">
            <div id="contacts-header">
                <div id="search">
                    {/*onKeyUp={suggest}*/}
                    <input id="search-input" placeholder="Find contact" type="text" />
                    {/*<i className="fe-search" style={{ fontSize: "32px" }}></i>*/}
                </div>
            </div>
            {props.client ?
                <div id="contactLst">
                    <ContactDivChildren contact={props.client} isClient />
                    {contacts.map((contact, index) => <ContactDivChildren key={index} contact={contact} />)}
                </div> :
                <div />
            }
        </div>
    );
}

class ContactDivChildren extends Component {
    contactClick(props) {
        Glob.showProfile(props.contact);
    }

    componentDidMount() {
        Glob.addToContactLst(this.props.contact);
    }

    render() {
        return (
            <div className="contact" onClick={() => this.contactClick(this.props)} >
                <img src={this.props.contact.avatar} alt="" className="avatar" />
                {!this.props.isClient ?
                    <div className="online-ico"></div> :
                    <div className="banner">You</div>
                }
                {this.props.contact.contactName}
            </div>
        );
    }
}