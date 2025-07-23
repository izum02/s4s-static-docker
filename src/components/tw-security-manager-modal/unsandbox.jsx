import React from 'react';
import {FormattedMessage} from 'react-intl';
import styles from './load-extension.css';
import {APP_NAME} from '../../lib/brand';

const Unsandbox = props => (
    <div>
        <p>
            <FormattedMessage
                id="tw.security.unsandbox.request"
                defaultMessage="プロジェクトは、{EXT_NAME} 拡張機能のサンドボックス化を解除することを要求しています。"
                description="Part of modal that appears when a project tries to unsandbox an extension"
                values={{EXT_NAME: props.extensionName}} // Optional: Inject EXT_NAME from props
            />
        </p>
        <div className={styles.unsandboxedWarning}>
            <FormattedMessage
                id="tw.security.unsandbox.warning"
                defaultMessage="サンドボックスなしで拡張機能を読み込むことは危険ですが、サンドボックス環境内では多くの機能が制限されるため、サンドボックス無しで読み込むことをおすすめします。また、サンドボックスなしでも通常のWebサイトと同じようなことしかできません。"
                description="Part of modal asking for permission to automatically load custom extension"
            />
        </div>
    </div>
);

export default Unsandbox;
