import SB3Downloader from "/src/containers/sb3-downloader.jsx";
import { getProjectFilename } from '/src/containers/sb3-downloader.jsx';

const getProjectThumbnail = () => new Promise(resolve => {
    window.vm.renderer.requestSnapshot(uri => {
        resolve(uri);
    });
});

export default async ({ addon, console, msg }) => {
    const CLIENT_ID = "1033286471224-n9mv8l869fqikubj2e8q92n8ige3qr6r.apps.googleusercontent.com";
    const REDIRECT_URI = "https://soiz1-s4s-upload.hf.space/close2";
    const SCOPES = "https://www.googleapis.com/auth/drive.file";
    const PROXY_URL = "https://soiz1-drive-proxy.hf.space/?file_id=";
    const SHORT_URL = "https://s4.rf.gd/";
    const SHARE_URL = "https://scratch-school.ct.ws/upload?id=";

    let accessToken = localStorage.getItem('googleDriveAccessToken') || null;
    let currentAccountEmail = localStorage.getItem('googleDriveAccountEmail') || null;
    let currentAccountName = localStorage.getItem('googleDriveAccountName') || null;

    while (true) {
        const targetElem = await addon.tab.waitForElement(
            'div[class*="menu-bar_file-group"] > div:last-child:not(.sa-record)',
            { markAsSeen: true }
        );

        if (!document.querySelector('.sa-custom-modal-button')) {
            const button = document.createElement("div");
            button.className = "sa-custom-modal-button " + targetElem.className;
            button.textContent = "保存";
            button.style.cursor = "pointer";

            button.addEventListener("click", () => {
                showMainModal(addon);
            });

            targetElem.parentElement.appendChild(button);
        }
        // 「フィードバックを送信」ボタンを作成
        const feedbackButton = document.createElement("div");
        feedbackButton.className = "sa-feedback-button " + targetElem.className;
        feedbackButton.textContent = "フィードバックを送信";
        feedbackButton.style.cursor = "pointer";
        feedbackButton.style.marginLeft = "10px"; // 少し間隔を空ける

        feedbackButton.addEventListener("click", () => {
            window.open("https://forms.gle/mP9U2biYcYUmupiY9", "_blank");
        });

        targetElem.parentElement.appendChild(feedbackButton);

    }

    function showMainModal(addon) {
        const modal = addon.tab.createModal("Googleドライブに保存", { 
            isOpen: true, 
            useEditorClasses: true,
            maxWidth: "800px",
            maxHeight: "80vh"
        });
        
        modal.content.innerHTML = `
            <div style="padding: 1rem; max-height: 70vh; overflow-y: auto;">
                <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Googleドライブに接続</h1>
                ${accessToken ? `
                    <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>ログイン中: ${currentAccountName || currentAccountEmail || 'Googleアカウント'}</div>
                        <button id="change-account-button" class="button" style="padding: 0.25rem 0.5rem; font-size: 0.9rem;">アカウントを変更</button>
                    </div>
                ` : `
                    <p style="margin-bottom: 1rem;">Googleでログインして、プロジェクトを保存または更新します。</p>
                    <button id="google-login-button" class="button">Googleでログイン</button>
                `}
                <div id="file-list-container" style="margin-top: 1rem; ${accessToken ? '' : 'display: none;'}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0; font-size: 1.2rem;">プロジェクト: <span id="project-title" style="cursor: pointer; border-bottom: 1px dashed #000; color: #333;">${window.vm.runtime.projectName || "無題"}</span></h2>
                        <button id="new-file-button" class="button">新規保存</button>
                    </div>
                    <div id="file-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;"></div>
                </div>
            </div>
        `;

        const loginButton = modal.content.querySelector("#google-login-button");
        const changeAccountButton = modal.content.querySelector("#change-account-button");
        const fileListContainer = modal.content.querySelector("#file-list-container");
        const fileList = modal.content.querySelector("#file-list");
        const newFileButton = modal.content.querySelector("#new-file-button");
        const projectTitle = modal.content.querySelector("#project-title");

        // プロジェクトタイトルの編集機能
        projectTitle?.addEventListener("dblclick", () => {
            const currentName = projectTitle.textContent;
            const input = document.createElement("input");
            input.type = "text";
            input.value = currentName;
            input.style.width = "200px";
            
            projectTitle.replaceWith(input);
            input.focus();

            const handleBlur = () => {
                const newName = input.value.trim() || "無題";
                window.vm.runtime.projectName = newName;
                projectTitle.textContent = newName;
                input.replaceWith(projectTitle);
            };

            input.addEventListener("blur", handleBlur);
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") handleBlur();
            });
        });

        if (loginButton) {
            loginButton.addEventListener("click", () => {
                startGoogleLogin(modal, addon);
            });
        }

        if (changeAccountButton) {
            changeAccountButton.addEventListener("click", () => {
                accessToken = null;
                currentAccountEmail = null;
                currentAccountName = null;
                localStorage.removeItem('googleDriveAccessToken');
                localStorage.removeItem('googleDriveAccountEmail');
                localStorage.removeItem('googleDriveAccountName');
                showMainModal(addon);
                modal.remove();
            });
        }

        newFileButton?.addEventListener("click", async () => {
            try {
                await saveToGoogleDrive(null, null, modal.remove, addon);
            } catch (error) {
                console.error("新規保存エラー:", error);
                showAlert(addon, "error", "新規保存に失敗しました");
            }
        });

        if (accessToken) {
            fetchDriveFiles(accessToken)
                .then(files => {
                    displayFileList(files, accessToken, modal, addon);
                    fileListContainer.style.display = "block";
                })
                .catch(error => {
                    console.error("ファイル一覧取得エラー:", error);
                    showAlert(addon, "error", "ファイル一覧の取得に失敗しました");
                });
        }

        modal.backdrop.addEventListener("click", modal.remove);
        modal.closeButton.addEventListener("click", modal.remove);
    }

    function startGoogleLogin(modal, addon) {
        const messageListener = (event) => {
            if (event.origin === "https://soiz1-penguin-upload.hf.space" && event.data.token) {
                window.removeEventListener("message", messageListener);
                accessToken = event.data.token;
                currentAccountEmail = event.data.email || null;
                currentAccountName = event.data.name || null;
                
                localStorage.setItem('googleDriveAccessToken', accessToken);
                if (currentAccountEmail) {
                    localStorage.setItem('googleDriveAccountEmail', currentAccountEmail);
                }
                if (currentAccountName) {
                    localStorage.setItem('googleDriveAccountName', currentAccountName);
                }
                
                showMainModal(addon);
                modal.remove();
            }
        };
        window.addEventListener("message", messageListener);

        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(SCOPES)}`;
        
        window.open(authUrl, "_blank", "width=500,height=600");
    }

    async function fetchDriveFiles(accessToken) {
        const response = await fetch("https://www.googleapis.com/drive/v3/files?q=(mimeType='application/x-scratch' or mimeType='image/png')", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();
        return data.files || [];
    }

    function displayFileList(files, accessToken, modal, addon) {
        const fileList = modal.content.querySelector("#file-list");
        fileList.innerHTML = "";

        // プロジェクトファイルとサムネイルを関連付ける
        const projectFiles = files.filter(file => file.mimeType === 'application/x-scratch');
        const thumbnailFiles = files.filter(file => file.mimeType === 'image/png');

        if (projectFiles.length === 0) {
            fileList.innerHTML = "<p style='grid-column: 1 / -1; text-align: center;'>保存されたファイルが見つかりません</p>";
            return;
        }

        projectFiles.forEach(project => {
            // 対応するサムネイルを探す
            const thumbnail = thumbnailFiles.find(
                thumb => thumb.name === `Penguin-Thumbnail-${project.id}.png`
            );

            const fileItem = document.createElement("div");
            fileItem.style.border = "1px solid #ddd";
            fileItem.style.borderRadius = "8px";
            fileItem.style.padding = "1rem";
            fileItem.style.display = "flex";
            fileItem.style.flexDirection = "column";
            fileItem.style.gap = "0.75rem";
            fileItem.style.background = "#fff";
            fileItem.style.height = "100%";

            // サムネイル表示
            const thumbnailContainer = document.createElement("div");
            thumbnailContainer.style.position = "relative";
            thumbnailContainer.style.aspectRatio = "4/3";
            thumbnailContainer.style.maxHeight = "150px";
            thumbnailContainer.style.overflow = "hidden";
            
            if (thumbnail) {
                const thumbnailImg = document.createElement("img");
                thumbnailImg.src = `https://drive.google.com/thumbnail?id=${thumbnail.id}&sz=w300`;
                thumbnailImg.style.width = "100%";
                thumbnailImg.style.height = "100%";
                thumbnailImg.style.borderRadius = "4px";
                thumbnailImg.style.objectFit = "contain";
                thumbnailImg.style.backgroundColor = "#f0f0f0";
                thumbnailContainer.appendChild(thumbnailImg);
            } else {
                const thumbnailPlaceholder = document.createElement("div");
                thumbnailPlaceholder.style.width = "100%";
                thumbnailPlaceholder.style.height = "100%";
                thumbnailPlaceholder.style.backgroundColor = "#f0f0f0";
                thumbnailPlaceholder.style.display = "flex";
                thumbnailPlaceholder.style.alignItems = "center";
                thumbnailPlaceholder.style.justifyContent = "center";
                thumbnailPlaceholder.style.borderRadius = "4px";
                thumbnailPlaceholder.textContent = "サムネイルなし";
                thumbnailContainer.appendChild(thumbnailPlaceholder);
            }
            fileItem.appendChild(thumbnailContainer);

            // プロジェクト名
            const fileName = document.createElement("h3");
            fileName.textContent = project.name.replace('.s4s.txt', '');
            fileName.style.margin = "0";
            fileName.style.fontSize = "1rem";
            fileName.style.textAlign = "center";
            fileName.style.fontWeight = "bold";
            fileName.style.color = "#333";
            fileItem.appendChild(fileName);

            // 共有リンク
            const linkContainer = document.createElement("div");
            linkContainer.style.display = "flex";
            linkContainer.style.flexDirection = "column";
            linkContainer.style.gap = "0.25rem";
            linkContainer.style.marginBottom = "0.5rem";

            const linkHeader = document.createElement("div");
            linkHeader.style.display = "flex";
            linkHeader.style.justifyContent = "space-between";
            linkHeader.style.alignItems = "center";

            const linkLabel = document.createElement("span");
            linkLabel.textContent = "共有リンク:";
            linkLabel.style.fontSize = "0.8em";
            linkLabel.style.color = "#555";

            const copyButton = document.createElement("button");
            copyButton.textContent = "コピー";
            copyButton.className = "button";
            copyButton.style.fontSize = "0.8em";
            copyButton.style.padding = "0.1rem 0.3rem";
            copyButton.style.backgroundColor = "#e9e9e9";
            copyButton.style.color = "#333";

            copyButton.addEventListener("click", (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`${SHORT_URL}${project.id}`)
                    .then(() => showAlert(addon, "success", "リンクをクリップボードにコピーしました"))
                    .catch(() => showAlert(addon, "error", "リンクのコピーに失敗しました"));
            });

            linkHeader.appendChild(linkLabel);
            linkHeader.appendChild(copyButton);
            linkContainer.appendChild(linkHeader);

            const linkUrl = document.createElement("a");
            linkUrl.href = `${SHORT_URL}${project.id}`;
            linkUrl.textContent = `${SHORT_URL}${project.id}`;
            linkUrl.target = "_blank";
            linkUrl.rel = "noopener noreferrer";
            linkUrl.style.fontSize = "0.9em";
            linkUrl.style.wordBreak = "break-all";
            linkUrl.style.color = "#1155cc";
            linkUrl.style.textDecoration = "none";
            linkUrl.style.borderBottom = "1px solid #1155cc";
            linkContainer.appendChild(linkUrl);

            fileItem.appendChild(linkContainer);

            // 操作ボタン
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "grid";
            buttonContainer.style.gridTemplateColumns = "1fr 1fr";
            buttonContainer.style.gap = "0.5rem";

            const loadButton = document.createElement("button");
            loadButton.textContent = "読み込む";
            loadButton.className = "button";
            loadButton.style.width = "100%";

            loadButton.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`"${project.name}"を読み込みますか？現在のプロジェクトは失われます。`)) {
                    const url = `${PROXY_URL}${project.id}`;
                    window.location.href = `?project_url=${encodeURIComponent(url)}`;
                }
            });

            const replaceButton = document.createElement("button");
            replaceButton.textContent = "上書き";
            replaceButton.className = "button";
            replaceButton.style.width = "100%";

            replaceButton.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`"${project.name}"を現在のプロジェクトで上書きしますか？`)) {
                    saveToGoogleDrive(project.id, project.name, () => {
                        fetchDriveFiles(accessToken)
                            .then(files => displayFileList(files, accessToken, modal, addon))
                            .catch(error => console.error("更新エラー:", error));
                    }, addon)
                    .catch(error => {
                        console.error("ファイル上書きエラー:", error);
                        showAlert(addon, "error", "ファイルの上書きに失敗しました");
                    });
                }
            });

            const shareButton = document.createElement("button");
            shareButton.textContent = "共有";
            shareButton.className = "button";
            shareButton.style.width = "100%";
            shareButton.style.backgroundColor = "#4CAF50";
            shareButton.style.color = "white";

            shareButton.addEventListener("click", (e) => {
                e.stopPropagation();
                window.open(`${SHARE_URL}${project.id}`, "_blank");
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "削除";
            deleteButton.className = "button";
            deleteButton.style.width = "100%";
            deleteButton.style.backgroundColor = "#ff4444";
            deleteButton.style.color = "white";

            deleteButton.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm(`"${project.name}"とそのサムネイルを完全に削除しますか？この操作は元に戻せません。`)) {
                    try {
                        // プロジェクトファイルを削除
                        await deleteFile(project.id, accessToken);
                        
                        // 対応するサムネイルを探して削除
                        const thumbnailToDelete = thumbnailFiles.find(
                            thumb => thumb.name === `Penguin-Thumbnail-${project.id}.png`
                        );
                        
                        if (thumbnailToDelete) {
                            await deleteFile(thumbnailToDelete.id, accessToken);
                        }
                        
                        showAlert(addon, "success", "ファイルを削除しました");
                        // リストを更新
                        fetchDriveFiles(accessToken)
                            .then(files => displayFileList(files, accessToken, modal, addon))
                            .catch(error => console.error("更新エラー:", error));
                    } catch (error) {
                        console.error("削除エラー:", error);
                        showAlert(addon, "error", "ファイルの削除に失敗しました");
                    }
                }
            });

            buttonContainer.appendChild(loadButton);
            buttonContainer.appendChild(replaceButton);
            buttonContainer.appendChild(shareButton);
            buttonContainer.appendChild(deleteButton);
            fileItem.appendChild(buttonContainer);

            fileList.appendChild(fileItem);
        });
    }

    async function deleteFile(fileId, accessToken) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
    }

    async function saveToGoogleDrive(fileId, fileName, onSuccess, addon) {
        try {
            // プロジェクトを保存
            const blob = await window.vm.saveProjectSb3();
            const projectName = window.vm.runtime.projectName || getProjectFilename || "無題";
            const nameToUse = fileName || `${projectName}.s4s.txt`;
            
            const metadata = {
                name: nameToUse,
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
                    Authorization: `Bearer ${accessToken}`,
                },
                body: form,
            });

            if (!uploadResponse.ok) {
                throw new Error(await uploadResponse.text());
            }

            const fileData = await uploadResponse.json();

            // サムネイルを保存
            try {
                const thumbnailDataUrl = await getProjectThumbnail();
                const thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob();
                const thumbnailMetadata = {
                    name: `Penguin-Thumbnail-${fileData.id}.png`,
                    mimeType: "image/png",
                };

                const existingThumbnailResponse = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q=name='${thumbnailMetadata.name}'`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
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
                        Authorization: `Bearer ${accessToken}`,
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
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        role: "reader",
                        type: "anyone",
                    }),
                });
            }

            showAlert(addon, "success", fileId ? "上書き保存しました" : "新規保存しました");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("保存エラー:", error);
            showAlert(addon, "error", `保存に失敗しました: ${error.message}`);
            throw error;
        }
    }

    function showAlert(addon, type, message) {
        addon.tab.redux.dispatch({
            type: "scratch-gui/alerts/SHOW_ALERT",
            payload: {
                alertType: type,
                message: message
            }
        });
    }
};