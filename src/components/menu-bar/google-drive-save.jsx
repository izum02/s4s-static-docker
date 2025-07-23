import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import Button from '../button/button.jsx';
import styles from './google-drive-save.css';
import { useSelector } from 'react-redux';

class GoogleDriveSave extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accessToken: localStorage.getItem('googleDriveAccessToken') || null,
            currentAccountEmail: localStorage.getItem('googleDriveAccountEmail') || null,
            currentAccountName: localStorage.getItem('googleDriveAccountName') || null,
            files: [],
            isModalOpen: false,
            isLoading: false,
            isProcessing: false,
            newFileName: props.projectTitle || '無題',
            showNewFileInput: false,
            sharePermission: 'reader', // 'reader', 'writer', or 'owner'
            selectedFileId: null
        };
        this.modalContentRef = React.createRef();
    }

    componentDidMount() {
        // 初期化処理
    }

    handleClick = () => {
        this.setState({isModalOpen: true});
    };

    handleCloseModal = () => {
        if (!this.state.isProcessing) {
            this.setState({isModalOpen: false, showNewFileInput: false});
        }
    };

    handleOverlayClick = (e) => {
        if (!this.state.isProcessing && this.modalContentRef.current && !this.modalContentRef.current.contains(e.target)) {
            this.handleCloseModal();
        }
    };

    startGoogleLogin = () => {
        if (this.state.isProcessing) return;
        
        localStorage.removeItem('googleDriveAccessToken');
        localStorage.removeItem('googleDriveAccountEmail');
        localStorage.removeItem('googleDriveAccountName');
        
        const CLIENT_ID = "169451419993-v1b3s315s8dkui950j2nm15hetr5i0qk.apps.googleusercontent.com";
        const REDIRECT_URI = "https://s-4-s-auth.hf.space/close2";
        const SCOPES = "https://www.googleapis.com/auth/drive.file";
        
        const messageListener = (event) => {
            if (event.data.token) {
                window.removeEventListener("message", messageListener);
                this.setState({
                    accessToken: event.data.token,
                    currentAccountEmail: event.data.email || null,
                    currentAccountName: event.data.name || null,
                    isModalOpen: true
                });
                
                this.fetchDriveFiles(event.data.token);
            }
        };
        window.addEventListener("message", messageListener);

        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(SCOPES)}`;
        
        window.open(authUrl, "_blank", "width=500,height=600");
    };

    fetchDriveFiles = async (accessToken) => {
        this.setState({isLoading: true});
        try {
            const response = await fetch("https://www.googleapis.com/drive/v3/files?q=(mimeType='application/x-scratch' or mimeType='image/png')", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            this.setState({files: data.files || [], isLoading: false});
        } catch (error) {
            console.error("ファイル一覧取得エラー:", error);
            alert("error", "ファイル一覧の取得に失敗しました");
            this.setState({isLoading: false});
        }
    };

    renderModal() {
        if (!this.state.isModalOpen) return null;

        return (
            <div className={styles.modalOverlay} onClick={this.handleOverlayClick}>
                <div className={styles.modalContent} ref={this.modalContentRef}>
                    <div className={styles.modalHeader}>
                        <h2>Googleドライブに保存</h2>
                        <button 
                            onClick={this.handleCloseModal} 
                            className={styles.closeButton}
                            disabled={this.state.isProcessing}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className={styles.modalBody}>
                        {this.renderAuthSection()}
                        {this.state.accessToken && this.renderNewFileSection()}
                        {this.state.accessToken && this.renderFileList()}
                    </div>
                    
                    {this.state.isProcessing && (
                        <div className={styles.processingOverlay}>
                            <div className={styles.spinner}></div>
                            <div>処理中...</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    renderAuthSection() {
        if (this.state.accessToken) {
            return (
                <div className={styles.authSection}>
                    <div className={styles.accountInfo}>
                        ログイン中: {this.state.currentAccountName || this.state.currentAccountEmail || 'Googleアカウント'}
                    </div>
                    <button 
                        onClick={this.handleChangeAccount}
                        className={styles.changeAccountButton}
                        disabled={this.state.isProcessing}
                    >
                        アカウントを変更
                    </button>
                </div>
            );
        }
        
        return (
            <div className={styles.authSection}>
                <p>Googleでログインして、プロジェクトを保存または更新します。</p>
                <button 
                    onClick={this.startGoogleLogin}
                    className={styles.loginButton}
                    disabled={this.state.isProcessing}
                >
                    Googleでログイン
                </button>
            </div>
        );
    }

    renderNewFileSection() {
        if (this.state.showNewFileInput) {
            return (
                <div className={styles.newFileSection}>
                    <div className={styles.newFileInputGroup}>
                        <input
                            type="text"
                            value={this.state.newFileName}
                            onChange={(e) => this.setState({newFileName: e.target.value})}
                            className={styles.newFileNameInput}
                            placeholder="ファイル名を入力"
                            disabled={this.state.isProcessing}
                        />
                        <div className={styles.permissionDropdown}>
                            <label>公開設定: </label>
                            <select
                                value={this.state.sharePermission}
                                onChange={(e) => this.setState({sharePermission: e.target.value})}
                                disabled={this.state.isProcessing}
                            >
                                <option value="reader">閲覧のみ</option>
                                <option value="writer">編集可能</option>
                                <option value="owner">所有者</option>
                            </select>
                        </div>
                        <button
                            onClick={this.handleNewFileSave}
                            className={styles.newFileSaveButton}
                            disabled={!this.state.newFileName.trim() || this.state.isProcessing}
                        >
                            保存
                        </button>
                        <button
                            onClick={() => this.setState({showNewFileInput: false})}
                            className={styles.newFileCancelButton}
                            disabled={this.state.isProcessing}
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.newFileSection}>
                <button 
                    onClick={() => this.setState({
                        showNewFileInput: true, 
                        newFileName: window.vm.runtime.projectName || '無題',
                        sharePermission: 'reader'
                    })}
                    className={styles.newFileButton}
                    disabled={this.state.isProcessing}
                >
                    新規保存
                </button>
            </div>
        );
    }

    renderFileList() {
        if (this.state.isLoading) {
            return <div className={styles.loading}>読み込み中...</div>;
        }

        const projectFiles = this.state.files.filter(file => file.mimeType === 'application/x-scratch');
        const thumbnailFiles = this.state.files.filter(file => file.mimeType === 'image/png');

        if (projectFiles.length === 0) {
            return <div className={styles.noFiles}>保存されたファイルが見つかりません</div>;
        }

        return (
            <div className={styles.fileListContainer}>
                <div className={styles.fileListHeader}>
                    <h3>保存済みプロジェクト</h3>
                </div>
                
                <div className={styles.fileList}>
                    {projectFiles.map(project => this.renderFileItem(project, thumbnailFiles))}
                </div>
            </div>
        );
    }

renderFileItem(project, thumbnailFiles) {
    const thumbnail = thumbnailFiles.find(
        thumb => thumb.name === `Scratch-Thumbnail-${project.id}.png`
    );

    return (
        <div key={project.id} className={styles.fileItem}>
            <div className={styles.thumbnailContainer}>
                {thumbnail ? (
                    <img 
                        src={`https://drive.google.com/thumbnail?id=${thumbnail.id}&sz=w300`}
                        alt="プロジェクトサムネイル"
                        className={styles.thumbnail}
                    />
                ) : (
                    <div className={styles.thumbnailPlaceholder}>
                        サムネイルなし
                    </div>
                )}
            </div>
            
            <h3 className={styles.fileName}>
                {project.name.replace('.s4s.txt', '')}
            </h3>
            
            {this.renderShareLink(project.id)}
            
            <div className={styles.buttonGroup}>
                <button 
                    onClick={() => this.handleLoadFile(project)}
                    className={styles.actionButton}
                    disabled={this.state.isProcessing}
                >
                    読み込む
                </button>
                <button 
                    onClick={() => this.handleReplaceFile(project)}
                    className={styles.actionButton}
                    disabled={this.state.isProcessing}
                >
                    上書き
                </button>
                <button 
                    onClick={() => this.handleShareFile(project.id)}
                    className={classNames(styles.actionButton, styles.shareButton)}
                    disabled={this.state.isProcessing}
                >
                    共有
                </button>
                <button 
                    onClick={() => this.handleDeleteFile(project, thumbnailFiles)}
                    className={classNames(styles.actionButton, styles.deleteButton)}
                    disabled={this.state.isProcessing}
                >
                    削除
                </button>
            </div>

            {/* ここにアクセス権限設定のドロップダウンを追加 */}
            <div className={styles.permissionDropdown}>
                <label>アクセス権限: </label>
                <select
                    value={this.state.sharePermission}
                    onChange={(e) => this.updateFilePermission(project.id, e.target.value)}
                    disabled={this.state.isProcessing}
                >
                    <option value="reader">閲覧のみ</option>
                    <option value="writer">編集可能</option>
                    <option value="owner">所有者</option>
                </select>
            </div>
        </div>
    );
}

updateFilePermission = async (fileId, permission) => {
    this.setState({isProcessing: true});
    try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/anyone`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${this.state.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                role: permission,
            }),
        });
        alert("success", "アクセス権限を更新しました");
    } catch (error) {
        console.error("権限更新エラー:", error);
        alert("error", "アクセス権限の更新に失敗しました");
    } finally {
        this.setState({isProcessing: false});
    }
};
    renderShareLink(fileId) {
        const SHORT_URL = "https://s4.rf.gd/";
        
        return (
            <div className={styles.linkContainer}>
                <div className={styles.linkHeader}>
                    <button 
                        onClick={() => this.copyToClipboard(`${SHORT_URL}${fileId}`)}
                        className={styles.copyButton}
                        disabled={this.state.isProcessing}
                    >
                        リンクをコピー
                    </button>
                    <button 
                        onClick={() => window.open(`https://scratch-school.ct.ws/bit.php?id=${fileId}`)}
                        className={styles.copyButton}
                        disabled={this.state.isProcessing}
                    >
                        リンクを短縮
                    </button>
                    <button 
                        onClick={() => this.copyToClipboard(fileId)}
                        className={styles.copyButton}
                        disabled={this.state.isProcessing}
                    >
                        IDのみコピー
                    </button>
                </div>
                <a 
                    href={`${SHORT_URL}${fileId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkUrl}
                >
                    {`${SHORT_URL}${fileId}`}
                </a>
            </div>
        );
    }

    render() {
        return (
            <div>
                <Button
                    className={classNames(
                        this.props.className,
                        styles.saveButton
                    )}
                    onClick={this.handleClick}
                >
                    <FormattedMessage
                        defaultMessage="Googleドライブに保存"
                        description="Label for Google Drive save button"
                        id="google.drive.saveButton"
                    />
                </Button>
                
                {this.renderModal()}
            </div>
        );
    }

    handleChangeAccount = () => {
        if (this.state.isProcessing) return;
        
        this.setState({
            accessToken: null,
            currentAccountEmail: null,
            currentAccountName: null
        });
        localStorage.removeItem('googleDriveAccessToken');
        localStorage.removeItem('googleDriveAccountEmail');
        localStorage.removeItem('googleDriveAccountName');
    };

    handleNewFileSave = async () => {
        this.setState({isProcessing: true});
        try {
            await this.saveToGoogleDrive(null, `${this.state.newFileName}.s4s.txt`, this.state.sharePermission);
            alert("success", "新規保存しました");
            this.setState({showNewFileInput: false});
            this.fetchDriveFiles(this.state.accessToken);
        } catch (error) {
            console.error("新規保存エラー:", error);
            alert("error", "新規保存に失敗しました");
        } finally {
            this.setState({isProcessing: false});
        }
    };

    handleLoadFile = (project) => {
        if (this.state.isProcessing) return;
        
        const PROXY_URL = "https://drive-proxy-s4s.vercel.app/?file_id=";
        
        if (confirm(`"${project.name}"を読み込みますか？現在のプロジェクトは失われます。`)) {
            const url = `${PROXY_URL}${project.id}`;
            window.location.href = `?project_url=${encodeURIComponent(url)}`;
        }
    };

    handleReplaceFile = async (project) => {
        if (this.state.isProcessing) return;
        
        if (confirm(`"${project.name}"を現在のプロジェクトで上書きしますか？`)) {
            this.setState({isProcessing: true});
            try {
                await this.saveToGoogleDrive(project.id, project.name);
                alert("success", "上書き保存しました");
                this.fetchDriveFiles(this.state.accessToken);
            } catch (error) {
                console.error("ファイル上書きエラー:", error);
                alert("error", "ファイルの上書きに失敗しました");
            } finally {
                this.setState({isProcessing: false});
            }
        }
    };

    handleShareFile = (fileId) => {
        if (this.state.isProcessing) return;
        
        const SHARE_URL = "https://scratch-school.ct.ws/upload?id=";
        window.open(`${SHARE_URL}${fileId}`, "_blank");
    };

    handleDeleteFile = async (project, thumbnailFiles) => {
        if (this.state.isProcessing) return;
        
        if (confirm(`"${project.name}"とそのサムネイルを完全に削除しますか？この操作は元に戻せません。`)) {
            this.setState({isProcessing: true});
            try {
                await this.deleteFile(project.id);
                
                const thumbnailToDelete = thumbnailFiles.find(
                    thumb => thumb.name === `Scratch-Thumbnail-${project.id}.png`
                );
                
                if (thumbnailToDelete) {
                    await this.deleteFile(thumbnailToDelete.id);
                }
                
                alert("success", "ファイルを削除しました");
                this.fetchDriveFiles(this.state.accessToken);
            } catch (error) {
                console.error("削除エラー:", error);
                alert("error", "ファイルの削除に失敗しました");
            } finally {
                this.setState({isProcessing: false});
            }
        }
    };

    copyToClipboard = (text) => {
        if (this.state.isProcessing) return;
        
        navigator.clipboard.writeText(text)
            .then(() => alert("success", "リンクをクリップボードにコピーしました"))
            .catch(() => alert("error", "リンクのコピーに失敗しました"));
    };

    async deleteFile(fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${this.state.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
    }

    async saveToGoogleDrive(fileId, fileName, permission = 'reader') {
        const blob = await window.vm.saveProjectSb3();
        
        const metadata = {
            name: fileName,
            mimeType: "application/x-scratch",
        };

        const url = fileId 
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", blob);

        const method = fileId ? "PATCH" : "POST";

        const uploadResponse = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.state.accessToken}`,
            },
            body: form,
        });

        if (!uploadResponse.ok) {
            throw new Error(await uploadResponse.text());
        }

        const fileData = await uploadResponse.json();

        try {
            const thumbnailDataUrl = await this.getProjectThumbnail();
            const thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob();
            const thumbnailMetadata = {
                name: `Scratch-Thumbnail-${fileData.id}.png`,
                mimeType: "image/png",
            };

            const existingThumbnailResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${thumbnailMetadata.name}'`,
                {
                    headers: {
                        Authorization: `Bearer ${this.state.accessToken}`,
                    },
                }
            );

            const existingThumbnailData = await existingThumbnailResponse.json();
            const thumbnailFileId = existingThumbnailData.files?.[0]?.id;

            const thumbnailUrl = thumbnailFileId
                ? `https://www.googleapis.com/upload/drive/v3/files/${thumbnailFileId}?uploadType=multipart`
                : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

            const thumbnailForm = new FormData();
            thumbnailForm.append("metadata", new Blob([JSON.stringify(thumbnailMetadata)], { type: "application/json" }));
            thumbnailForm.append("file", thumbnailBlob);

            const thumbnailMethod = thumbnailFileId ? "PATCH" : "POST";

            await fetch(thumbnailUrl, {
                method: thumbnailMethod,
                headers: {
                    Authorization: `Bearer ${this.state.accessToken}`,
                },
                body: thumbnailForm,
            });
        } catch (thumbnailError) {
            console.warn("サムネイルの保存に失敗しました:", thumbnailError);
        }

        if (!fileId) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.state.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role: permission, // ここで公開設定を使用
                    type: "anyone",
                }),
            });
        }
    }

    getProjectThumbnail() {
        return new Promise(resolve => {
            window.vm.renderer.requestSnapshot(uri => {
                resolve(uri);
            });
        });
    }
}

GoogleDriveSave.propTypes = {
    className: PropTypes.string,
    showAlert: PropTypes.func.isRequired,
    projectTitle: PropTypes.string
};
const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle
});
export default connect(mapStateToProps)(GoogleDriveSave);