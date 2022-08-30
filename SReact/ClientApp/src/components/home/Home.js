import { React, useState, useEffect, Component, createRef, forwardRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { Modal } from 'react-bootstrap';

import FABpopup from './homeGadgets';
import ProfilePage from './profilePage';
import MessageBox from './messageBox';
import * as Glob from '../../script/Global';

class Home extends Component {
    constructor(props) {
        super(props);
        //props not set now
        this.state = {
            profile: this.props.client,
            contactLst: [],                         // a list of current chatBox info
            rmvMsg: false
        }
        while (Glob.getHome().length > 0)             //fast since there's 1
            Glob.getHome().pop();
        Glob.getHome().push(this);
        this.setProfile = this.setProfile.bind(this);
        this.closeChat = this.closeChat.bind(this);
        this.removeMsgModal = this.removeMsgModal.bind(this);
    }

    //both setProfile and setGroup now setting 'profile'
    async setProfile(_profile) {
        var fullProfile = this.state.contactLst.find(ele => ele.email === _profile.email);
        if (!fullProfile) {
            //if is not full -> fetch
                //??just _profile is enough? no need fetching?
            if (!_profile.contactName)
                fullProfile = await (await fetch("Chat/GetInfo?email=" + _profile.email)).json();
            //if full or couldn't fetch
            if (!fullProfile)
                fullProfile = _profile;
            if (fullProfile.email !== this.props.client.email)
                this.state.contactLst.push(fullProfile);
        }
        //set as profile
        this.setState({ profile: fullProfile });
    }

    async setGroup(_group) {
        var fullGroup = this.state.contactLst.find(ele => ele.chatGroupId === _group.chatGroupId);
        if (!fullGroup) {
            //...
            fullGroup = _group;
            this.state.contactLst.push(fullGroup);
        }
        this.setState({});
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
                        contact.email ?
                            <MessageBox key={contact.email} info={contact} isPrivate /> :
                            <MessageBox key={contact.chatGroupId} info={contact} />
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
    const [userContacts, setUserContacts] = useState([]);
    const [groupContacts, setGroupContacts] = useState([]);
    const searchRef = createRef();
    const modalRef = createRef();

    useEffect(() => {
        var users, groups;
        (async () => {
            users = fetch("/Chat/GetOtherChatUsers");                           //400-500ms
            groups = fetch("/Chat/GetChatGroups");
            setUserContacts(await (await(users)).json());
            setGroupContacts(await (await (groups)).json());
            /*users = await (await fetch("/Chat/GetOtherChatUsers")).json();    //500-600ms
            groups = await (await fetch("/Chat/GetChatGroups")).json();
            setUserContacts(users);
            setGroupContacts(groups);*/
        })()
    }, []);

    function suggest() {
        /*var val = searchRef.current.value;
        //? post each times, receive at most 10 most-relevant values
        contacts.forEach(function (val) {

        })*/
    }

    function showGroupModal() {
        modalRef.current.toggleModal(true);
    }

    return (
        <div id="contacts">
            <div id="contacts-header">
                <div id="search">
                    <input id="search-input" placeholder="Find contact" type="text" onKeyDown={suggest} ref={searchRef} />
                    <i className="fa fa-magnifying-glass hover-ptr"></i>
                </div>
                <div className="icon-btn">
                    <i className="fa fa-user-plus"></i>
                </div>
                <div className="icon-btn" onClick={showGroupModal}>
                    <i className="fa fa-users-rectangle"></i>
                </div>
                <GroupModal contacts={userContacts} ref={modalRef}/>
            </div>
            {props.client ?
                <div id="contactLst">
                    <ContactDivChildren contact={props.client} isClient />
                    {userContacts.map((info) => <ContactDivChildren key={info.email} contact={info} isPrivate />)}
                    {groupContacts.map((info) => <ContactDivChildren key={info.groupName} contact={info} isGroup />)}
                </div> :
                <div />
            }
        </div>
    );
}

//called 4 times
//2 times when otherUsers were fetched
const GroupModal = forwardRef((props, ref) => {
    const [showing, setShowing] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [reloadVar, setReloadVar] = useState(false);

    useImperativeHandle(ref, () => ({
        toggleModal(bool) {
            setShowing(bool);
            setContacts(props.contacts);            //can add people outside contacts
        }
    }));

    useEffect(() => { }, [reloadVar])

    function closeModal() {
        //setContacts doesn't work
        setShowing(false);
    }

    function createGroup() {
        var name = $("#group-name-input").val();
        if (name.length == 0) {
            alert("Group name can not be blank.");
            return;
        }
        var lst = [Glob.getUserMail()];
        contacts.forEach((ele) => {
            if (ele.checked)
                lst.push(ele.email);
        })
        $.post("Chat/CreateGroup",
            { name: name, memberMails: JSON.stringify(lst) },
            function (response) { /*setComments(response);*/ }
        );
        setShowing(false);
    }

    function toggleContact(mail) {
        var contact = contacts.find(ele => ele.email == mail);
        contact.checked = !contact.checked;
        setContacts(contacts);
        setReloadVar(!reloadVar);
    }

    return (
        <Modal show={showing}>
            <Modal.Header>
                <Modal.Title>Create a new group</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <input id="group-name-input" placeholder="Group Name" type="text" />
                {contacts.map((contact) =>
                    <div key={contact.email} onClick={() => toggleContact(contact.email)}>
                        <input type="checkbox" value={contact.contactName}
                            onClick={(e) => { e.stopPropagation(); toggleContact(contact.email); }}
                            onChange={() => { }} checked={contact.checked ? true : false} />
                        {contact.contactName}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <div className="btn btn-danger" onClick={createGroup}>Create</div>
                <div className="btn btn-primary" onClick={closeModal}>Cancel</div>
            </Modal.Footer>
        </Modal>
    );
})

class ContactDivChildren extends Component {
    contactClick(props) {
        if (!this.props.isGroup)
            Glob.showProfile(props.contact);
        else
            Glob.showGroup(props.contact);
    }

    componentDidMount() {
        Glob.addToContactLst(this.props.contact);
    }

    render() {
        if (this.props.isClient)
            return (
                <div className="contact" onClick={() => this.contactClick(this.props)} >
                    <img src={this.props.contact.avatar} alt="" className="avatar" />
                    <div className="banner">You</div>
                    {this.props.contact.contactName}
                </div>
            );
        if (this.props.isPrivate)
            return (
                <div className="contact" onClick={() => this.contactClick(this.props)} >
                    <img src={this.props.contact.avatar} alt="" className="avatar" />
                    <div className="online-ico"></div>
                    {this.props.contact.contactName}
                </div>
            );
        return (
            <div className="contact" onClick={() => this.contactClick(this.props)} >
                <img src={this.props.contact.avatar} alt="" className="avatar" />
                {this.props.contact.groupName}
            </div>
        );
    }
}