import { React, Component, useState, useEffect, forwardRef, useImperativeHandle, createRef } from 'react';
import { Modal } from 'react-bootstrap';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import $ from 'jquery';

import * as Glob from '../../script/Global';

/*ProfilePage, FriendBtn, PostModal, PostArea*/

function ProfilePage(props) {
    const modalRef = createRef();

    function togglePost(bool) {
        modalRef.current.togglePost(bool);
    }

    if (!props.profile)
        return (<div />);

    return (
        <div id="profile-page">
            <div id="profile-header">
                <img className="cover-pic" src={props.profile.coverImg} alt="" />
                <div id="profile-info-div">
                    <img className="profile-pic" src={props.profile.avatar} alt="" />
                    <div className="profile-name">{props.profile.contactName}</div>
                </div>
            </div>
            {props.profile.email !== Glob.getUserMail() ?
                <div id="btn-bar">
                    <FriendBtn info={props.profile} />
                    <div className="btn-bar-button">
                        <div className="message-btn btn" onClick={() => Glob.showProfile(props.profile)}>Message</div>
                    </div>
                </div> :
                <div id="btn-bar">
                    <div className="btn-bar-button">
                        <div className="post-btn btn" onClick={() => togglePost(true)}>Create a post</div>
                    </div>
                </div>
            }
            <PostModal ref={modalRef}/>
            <div className="post-area-container">
                <PostArea profile={props.profile} />
            </div>
        </div>
    );
}

export default ProfilePage;

class FriendBtn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isFriend: this.props.info.isFriend,
            loading: false,
            sent: 0,
            received: 0,
            removing: false
        }
        while (Glob.getFriendBtn().length > 0)             //fast since there's 1
            Glob.getFriendBtn().pop();
        Glob.getFriendBtn().push(this);
        this.fetchReceived = this.fetchReceived.bind(this);
        this.fetchSent = this.fetchSent.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.stopLoading = this.stopLoading.bind(this);
        this.setFriend = this.setFriend.bind(this);
    }

    setFriend(bool) {
        this.setState({ isFriend: bool });
    }

    stopLoading() {
        this.setState({ loading: false });
        this.UNSAFE_componentWillMount();
    }

    fetchReceived() {
        var id = -1;
        var targetMail = this.props.info.email;
        Glob.getRcvNotify().forEach(function (val) {
            if (val.type === "friend" && val.sender.email === targetMail && !val.status)
                id = val.notificationId;
        });
        this.setState({ received: id });
    }

    fetchSent() {
        var id = -1;
        var targetMail = this.props.info.email;
        Glob.getSentNotify().forEach(function (val) {
            if (val.type === "friend" && val.receiver.email === targetMail && !val.status)
                id = val.notificationId;
        });
        this.setState({ sent: id });
    }

    handleClick() {
        if (this.state.loading)
            return;
        if (this.props.info.isFriend) {
            //attempt removing friend
            Glob.setTargetMsg(0, this.props.info.email);
            this.setState({ removing: true });
        }
        else {
            if (this.state.sent > 0) {
                //delete request
                this.setState({ loading: true });
                $.post('Chat/DeleteNotification?id=' + this.state.sent, this.setState({ loading: false, sent: -1 }))
            }
            else if (this.state.received > 0) {
                //??? show hidden buttons (whether accept or not)
                //accept request
                this.setState({ loading: true });
                $.post('Chat/UpdateNotification?id=' + this.state.received + '&confirm=true', this.setState({ isFriend: true }))
            }
            else {
                //send request
                Glob.getConnection().invoke("SendFriendRequest", this.props.info.email);
                this.setState({ loading: true });
            }
        }
    }

    UNSAFE_componentWillMount() {
        if (!this.state.isFriend) {
            this.fetchReceived();
            this.fetchSent();
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            this.setState({ isFriend: this.props.info.isFriend });
            this.fetchReceived();
            this.fetchSent();
        }
    }

    render() {
        return (
            <div className="btn-bar-button btn-with-margin">
                <div className="friend-btn btn" onClick={() => this.handleClick()}>
                    {this.state.isFriend ?
                        "Remove friend" :
                        (this.state.loading ? <div className="loader"></div> :
                            this.state.sent > 0 ? "Remove request" :
                                this.state.received > 0 ? "Confirm request" : "Add friend")
                    }
                </div>
                <Modal show={this.state.removing}>
                    <Modal.Header>
                        <Modal.Title>Remove this friend?</Modal.Title>
                    </Modal.Header>
                    <Modal.Footer>
                        <div className="btn btn-danger" onClick={() => { this.setState({ removing: false }); Glob.removeFriend(); }}>Confirm</div>
                        <div className="btn btn-primary" onClick={() => { this.setState({ removing: false }); }}>Cancel</div>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

const PostModal = forwardRef((props, ref) => {
    const [post, setPost] = useState(false);
    const [editor, setEditor] = useState(null);
    const [files, setFiles] = useState([]);
    const [buttonText, setButtonText] = useState('Choose a file...');
    const [tags, setTags] = useState([]);
    
    useEffect(() => { }, [tags])

    useImperativeHandle(ref, () => ({
        togglePost(bool) {
            setPost(bool);
        }
    }));
    
    function updateFile(e) {
        //only 1
        setFiles(e.target.files[0]);
        setButtonText(e.target.files[0].name);
    }

    function addTag() {
        var txt = $('#addTag').val();
        $('#addTag').val("");
        if (txt.length === 0 || tags.includes(txt))
            return;
        var lst = tags;
        lst.push(txt);
        setTags([...lst]);
    }

    function removeTag(txt) {
        if (tags.includes(txt))
            setTags(tags.filter(ele => ele !== txt));
    }

    function createPost() {
        var content = editor.getData();
        if (content.length == 0) {
            alert("A post must have content");
            return;
        }
        var formData = new FormData();
        formData.append("restriction", "");
        formData.append("content", content);
        formData.append("file", files);
        formData.append("tags", JSON.stringify(tags));
        setTags([])
        setPost(false);
        $.ajax({
            type: "POST",
            url: 'Chat/CreatePost',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) { Glob.updateProfilePage(); }
        });
    }

    function closePost() {
        setPost(false);
        setFiles([]);
        setButtonText('Choose a file...');
        setTags([]);
    }

    return (
        <Modal show={post}>
            <Modal.Header>
                <Modal.Title>Create a post</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <CKEditor editor={ClassicEditor}
                    config={{ toolbar: { items: ['heading', '|', 'bold', 'italic', 'bulletedList', 'numberedList', 'undo', 'redo'] } }}
                    onReady={editor => { setEditor(editor); }}></CKEditor>
                <br />
                <input className="hidden" type="file" id="postFile" onChange={updateFile} />
                <label htmlFor="postFile" className="upload-btn" id="postFileLable">
                    <i className="fas fa-upload"></i>
                    {buttonText}
                </label>
                <br />
                <div>
                    {tags.map((ele) =>
                        <div className="post-tag-adding" key={ele}>
                            {ele}
                            <i className="fa-regular fa-circle-xmark" onClick={() => removeTag(ele)}></i>
                        </div>
                    )}
                    <input type="text" id="addTag" />
                    <i className="fa-solid fa-circle-plus" onClick={addTag}></i>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="btn btn-danger" onClick={createPost}>Create</div>
                <div className="btn btn-primary" onClick={closePost}>Cancel</div>
            </Modal.Footer>
        </Modal>
    )
})

//reload posts only reload postArea
//groupPost is different
class PostArea extends Component {
    constructor(props) {
        super();
        this.state = {
            profile: props.profile,
            posts : []
        }
        while (Glob.getPostArea().length > 0)
            Glob.getPostArea().pop();
        Glob.getPostArea().push(this);

        this.reload = this.reload.bind(this);

        this.reload();
    }

    async reload() {
        var response = await (await Glob.fetchPosts(this.state.profile.email)).json();
        //larger postId comes first
        var sorted = response.sort(function compareFn(a, b) {
            if (a.postId > b.postId)
                return -1;
            return 1;
        });
        this.setState({ posts: sorted });
        console.log(sorted);
    }

    render() {
        return (
            <div className="post-area">
                {this.state.posts.map((ele) => <Post key={ele.postId} data={ele} />)}
            </div>
        );
    }
}

//still use msg-file
function Post(props) {
    const data = props.data;
    const writable = createRef();
    const [fileStruct, setFiles] = useState([]);

    useEffect(() => {
        if (data.file) {
            const fileStruct = { file: data.file, extension: data.file.split('.').pop() }
            var fileArr = [fileStruct];
            setFiles(fileArr);
        }
    }, []);

    function commentClick() {
        writable.current.focusInput();
    }

    function getFile(fileName) {
        return "/upload-post/" + fileName;
    }

    return (
        <div key={data.postId} className="post">
            <div className="post-header">
                <img className="avatar" src={data.author.avatar} alt="" onClick={() => Glob.showProfile(data.author)} />
                <div className="post-header-c2">
                    <div style={{ 'fontWeight': 'bold' }}>{Glob.getContactName(data.author)}</div>
                    <div>{Glob.toClientTime(data.time)}</div>
                </div>
            </div>
            <div className="post-body">
                <div dangerouslySetInnerHTML={{ __html: data.content }}></div>
                {fileStruct.length > 0 ?
                    fileStruct.map(ele =>
                        ele.extension === 'png' || ele.extension === 'jpg' ?
                            <div key={ele.file} className="post-img-container">
                                <img src={getFile(ele.file)} alt="" />
                            </div> :
                            ele.extension === 'mp4' ?
                                <video key={ele.file} className="post-video" controls>
                                    <source src={getFile(ele.file)} type="video/mp4" />
                                </video> :
                                <a key={ele.file} className="msg-file" href={getFile(ele.file)} >
                                    {ele.file}
                                    <i className="fas fa-file"></i>
                                </a>
                    ) :
                    <div></div>
                }
                <div className="post-tag-container">
                    {data.tags.map((ele) => <div key={ele} className="post-tag">#{ele}</div>)}
                </div>
            </div>
            <div className="post-footer">
                <div className="post-footer-c1">
                    <div>{data.reactions ? "reaction here..." : ""}</div>
                    <div>{data.comment ? data.comment.length + " Comments" : ""}</div>
                </div>
                <div className="post-footer-c2">
                    <div className="post-btn">Like</div>
                    <div className="post-btn" onClick={commentClick}>Comment</div>
                </div>
                <div className="post-footer-c3">
                    <Comment ref={writable} writable />
                    {data.comment ? "comment here..." : ""}
                </div>
            </div>
        </div>
    );
}

//editable
class Comment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            write: this.props.writable ? true : false
        }
        this.input = createRef();

        this.commentKeyDown = this.commentKeyDown.bind(this);
    }

    focusInput() {
        this.input.current.focus();
    }

    commentKeyDown(e) {
        if (e.key === 'Enter')
            console.log("Send comment...");
    }

    render() {
        return (
            <div className="post-comment">
                {this.state.write ?
                    <div>
                        <img src={Glob.getUserProfile().avatar} alt="" className="avatar-small" />
                        <div className="comment-group">
                            <input placeholder="Write a comment..." type="text" onKeyDown={this.commentKeyDown} ref={this.input} />
                            <i className="fa-regular fa-face-smile"></i>
                        </div>
                    </div> :
                    <div />}
            </div>
        );
    }
}