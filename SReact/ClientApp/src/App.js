import { React, useState, useEffect } from 'react';
import Nav from './components/Nav';
import Home from './components/home/Home';
import FriendWindow from './components/Friends';
import CallWindow from './components/CallWindow';
import Settings from './components/Settings';
import Account from './components/Account';
import { GetClientChatInfo } from './script/Identity';
import { ConnectionConstructor } from './script/Chat';
import { init } from './script/Global';

function App(props) {
    const [clientInfo, setClient] = useState("");
    const connection = ConnectionConstructor("/chatHub");

    useEffect(() => {
        //Move inside to preserve
        var response;
        
        (async () => {
            response = await (await GetClientChatInfo()).json();
            setClient(response);
            await init(document, response, connection);

            const script = document.createElement("script");
            script.type = "module";
            script.src = "https://cdn.skypack.dev/emoji-picker-element@^1";
            document.body.appendChild(script);
        })();

    }, []);

    return (
        <div>
            <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css" />
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" />
            <div id="container">
                <Nav client={clientInfo} />
                {(props.path === '/' || props.path === '/home') ?
                    <Home client={clientInfo} /> :
                    props.path === '/friends' ?
                        <FriendWindow client={clientInfo} /> :
                        props.path === '/call' ?
                            <CallWindow client={clientInfo} /> :
                            props.path === '/settings' ?
                                <Settings client= { clientInfo } /> :
                                props.path === '/profile' ?
                                    <Account client={clientInfo} /> :
                                    <div />
                }
            </div>
        </div>
    );
}

export default App;