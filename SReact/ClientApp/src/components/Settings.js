import { React } from 'react';
import * as Glob from '../script/Global';

function Settings() {
    //check if user customized
    return (
        <div id="content-container">
            <div id="settings-wrapper">
                <div className="switch-label">Dark Mode</div>
                <div className="custom-control custom-switch">
                    <input type="checkbox" className="custom-control-input" id="themeSwitch"
                        defaultChecked={Glob.getTheme() === 1 ? true : false} onChange={Glob.changeTheme} />
                    <label className="custom-control-label" htmlFor="themeSwitch"></label>
                </div>
            </div>
        </div>
    )
}

export default Settings;