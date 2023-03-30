class App {
  constructor() {
    this.data_retrieval_refresh_rate = 5000;
    this.file_handler = new FileHandler();
    this.api_handler = new ApiHandler();
    this.encrpytion_handler = new EncrpytionHandler();
    // console.log(this.encrpytion_handler.GenerateKey().toString());
    // window.addEventListener("DOMContentLoaded", () => {
    this.ui_handler = new UiHandler();
    // });
    this.user_data;
  }

  LogOut() {
    document.cookie.split(";").forEach(function (c) {
      if ((document.cookie = c.trim().split("=")[0] == "session_token")) {
        document.cookie =
          c.trim().split("=")[0] +
          "=;" +
          "expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
    });
  }
}

class FileHandler {
  CreateBufferArray(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        let arrayBuffer = this.result,
          array = new Uint8Array(arrayBuffer);
        // binaryString = String.fromCharCode.apply(null, array);

        // encrypt the buffer here
        // const encrypted_string = app.encrpytion_handler.EncryptFile(array);

        resolve(array);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  async DownloadFile(file_id) {
    const response = await app.api_handler.RequestFileData(file_id);
    const file_byte_arr = response.file_data;
    var new_buffer;
    try {
      new_buffer = await app.encrpytion_handler.DecryptFile(
        file_byte_arr.data,
        response.key_for_user.encrypted_key
      );
      const buf_arr = new_buffer.split(",");
      const buffer = new ArrayBuffer(buf_arr.length);
      const view = new Uint8Array(buffer);
      for (const i in buf_arr) {
        view[i] = buf_arr[i];
      }

      const blob = new Blob([buffer], {
        type: response.type,
      });
      const link = document.createElement("a");
      // link.target = "_blank";
      link.href = window.URL.createObjectURL(blob);
      link.download = `${response.fileName}`;
      link.click();
    } catch (err) {
      window.alert("Error when decrypting file.");
    }
  }
}

class EncrpytionHandler {
  // CryptoJS
  async GenerateKey() {
    // const iv = CryptoJS.randomBytes(128);
    // return iv.toString(16);
    var buf = new Uint8Array(128);
    // populates buffer array with random numbers
    buf = window.crypto.getRandomValues(buf);
    // converts random nums to hex
    return [...buf].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  async EncryptFile(buffer) {
    // generate new key for encryption
    const shared_key = await this.GenerateKey();

    // encrypted = encrypted data
    var encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(buffer.toString()),
      shared_key
    );

    // encrypt shared key with user's public key
    // const encrypted_key = await this.EncryptKey(shared_key);
    return { data: encrypted.toString(), key: shared_key };
  }

  async EncryptKey(symmetric_key, public_key) {
    // must use RSA

    const rsa_key = new window.rsa(public_key);
    if (rsa_key.isPrivate()) {
      throw new Error("Key retrieved from server is not a public key.")
    }

    // rsa_key.importKey(public_key, "pkcs8");
    const encrypted = rsa_key.encrypt(symmetric_key, "base64");
    // var encrypted = CryptoJS.AES.encrypt(symmetric_key, public_key);

    // decrypt
    // const decrypted = rsa_key.decrypt(encrypted, "utf8"); // key must be private not public

    var encrypted_key = encrypted.toString();
    return encrypted_key;
  }

  async DecryptKey(encrypted_key, private_key) {
    // decrypt encrypted key with public key
    var bytes = CryptoJS.AES.decrypt(encrypted_key, public_key);

    var decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData;
  }

  async DecryptPrivateKey(encrypted_key, encrypted_private_key) {
    const password = prompt("Enter your password:");
    const password_hash = CryptoJS.SHA256(password);

    const bytes = CryptoJS.AES.decrypt(encrypted_private_key, password_hash.toString());

    const private_Key = bytes.toString(CryptoJS.enc.Utf8);
    return private_Key;

    // return decryptedData;
  }

  async DecryptFile(buffer, encrypted_key) {
    const user_data = JSON.parse(localStorage.getItem("user_data"));

    // key used to encrypt the encrypted shared key
    const Encrypted_Private_Key = user_data.Encrypted_Private_Key;

    const privateKey = await this.DecryptPrivateKey(encrypted_key, Encrypted_Private_Key);
    let data_string = "";

    for (const char in buffer) {
      data_string += String.fromCharCode(buffer[char]);
    }

    const utf_string = stringFromUTF8Array(buffer)

    // // responsible for successfully decrypting data
    function stringFromUTF8Array(data) {
      const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
      var count = data.length;
      var str = "";

      for (var index = 0; index < count;) {
        var ch = data[index++];
        if (ch & 0x80) {
          var extra = extraByteMap[(ch >> 3) & 0x07];
          if (!(ch & 0x40) || !extra || ((index + extra) > count))
            return null;

          ch = ch & (0x3F >> extra);
          for (; extra > 0; extra -= 1) {
            var chx = data[index++];
            if ((chx & 0xC0) != 0x80)
              return null;

            ch = (ch << 6) | (chx & 0x3F);
          }
        }

        str += String.fromCharCode(ch);
      }

      return str;
    }

    try {
      const key = new window.rsa(privateKey)
      if (!key.isPrivate()) {
        throw new Error("Key is not private")
      }
      const decryptedData = key.decrypt(data_string)
      return decryptedData;
    }
    catch (err) {
      console.error(err)
      throw err;
    }


    // var bytes = CryptoJS.AES.decrypt(data_string, decryption_key);

    // var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    return "";
  }
}

class ApiHandler {
  constructor() {
    (async () => {
      await this.init(false);
    })();
    this.data_refresh_interval = 5000;
  }
  // recursive using timeouts
  init = async (use_storage = false, initialiseUI = true) => {
    try {
      if (use_storage) {
        this.company_data = JSON.parse(localStorage.getItem("company_data"));
        app.ui_handler.UpdateCompanyDataUi(this.session_data);
      } else {
        throw new Error("Don't use storage to fetch company data.");
      }
    } catch {
      // const company_data = await this.GetCompanyData();
      // this.session_data = company_data;
      // const file_data = await this.GetFileMetaData();
      const file_data = await this.InitialData();

      this.company_data = {
        company_name: file_data.name,
        company_logo: file_data.logo,
      };

      (this.user_data = file_data.user_data),
        (this.fileMeta = file_data.files),
        // company data = name and logo
        localStorage.setItem("company_data", JSON.stringify(this.company_data));

      // user_data = user related data
      localStorage.setItem("user_data", JSON.stringify(this.user_data));

      // files = company files
      localStorage.setItem("fileMeta", JSON.stringify(this.fileMeta));

      app.ui_handler.UpdateCompanyDataUi(this.company_data);
      if (initialiseUI) {
        app.ui_handler.InitialiseUI();
      }
      // app.ui_handler.UpdateFileDisplay(document.querySelector('.'))
    }
    setInterval(async () => {
      const file_data = await this.GetFileMetaData();
      this.fileMeta = file_data.files;
      localStorage.setItem("fileMeta", JSON.stringify(this.fileMeta));
      // app.ui_handler.UpdateCompanyDataUi(this.file_data);
    }, this.data_refresh_interval);
  };
  InitialData = async () => {
    const response = await fetch("/initial");
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  GetFileMetaData = async () => {
    const response = await fetch("/fileMeta");
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  RequestFileData = async (file_id, user_id) => {
    const response = await fetch(`/filedata?file_id=${file_id}`);
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  // used within init
  GetCompanyData = async () => {
    try {
      const response = await fetch("/data");
      if (response.status != 200) {
        window.location.reload();
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
  };
  //uploads file to server
  UploadFile = async (json_obj) => {
    const body = {
      file: JSON.stringify(json_obj),
      dateTime: new Date().toLocaleString(),
    };

    // let formData = new FormData();
    // let photo = document.getElementById("file_input").files[0];

    // formData.append("file", photo);
    // fetch("/file", { method: "POST", body: formData });

    const response = await fetch("/file", {
      method: "POST",
      body: JSON.stringify(body),
    });

    window.location.reload();
    // response;
  };
  GetUnauthorisedFiles = async () => {
    const response = await fetch("/authFiles");
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  AuthoriseFile = async (file_id) => {
    const response = await fetch(`/authFile?file_id=${file_id}`);
    if (response.status == 200) {
      return true;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return;
    }
  };
  DeleteFile = async (file_id) => {
    const response = await fetch(`/delFile?file_id=${file_id}`);
    if (response.status == 200) {
      return true;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return;
    }
  };
  GetOtherUsers = async (clientID) => {
    const response = await fetch(`/users`);
    if (response.status == 200) {
      var data = await response.json();
      data = data.filter((user) => {
        if (user.ID != clientID) {
          return user;
        }
      });
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return;
    }
  };
  GetOtherUserIdsAndPublicKeys = async (clientID, otherIds = []) => {
    let base_uri = `/users/publicKeys`;
    if (otherIds.length > 0) {
      base_uri += "?";
      for (const id of otherIds) {
        base_uri += `id=${id}&`;
      }
      base_uri = base_uri.slice(0, base_uri.length - 1);
    }
    const response = await fetch(base_uri);
    if (response.status == 200) {
      var data = await response.json();
      data = data.filter((user) => {
        if (user.ID != clientID) {
          return user;
        }
      });
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return;
    }
  };
}

class UiHandler {
  constructor() {
    this.displayed_files_string;
    // this.InitialiseUI();
    // this.UpdateCompanyDataUi();
  }

  InitialiseUI() {
    // log out functionality
    const log_out_div = document.querySelector(".log_out_div");
    log_out_div.addEventListener("click", () => {
      app.LogOut();
      window.location.reload();
    });

    const DisplayHomeContent = () => {
      this.displayed_files = "";
      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = "";

      folder_view.innerHTML = `
      <div class="home_buttons">
        <div class="home_upload_btn" id="home_upload_btn">
          <span>Upload</span>
          <div class="upload_img_div"></div> 
        </div>
      </div>
        <div class="file_display_header">
          <div class="home_recent_header">Recent</div>
          <div class="refresh_btn"></div>
        </div>
        <div class="recent_files_div">
      </div>`;

      const home_upload_btn = folder_view.querySelector(".home_upload_btn");
      home_upload_btn.addEventListener("click", this.OpenModal);

      const file_display_header = folder_view.querySelector(
        ".file_display_header"
      );
      file_display_header.addEventListener("click", () => {
        this.UpdateListFileDisplay(recent_files_div);
      });

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "Home";

      const recent_files_div = folder_view.querySelector(".recent_files_div");
      this.UpdateListFileDisplay(recent_files_div);

      // auto refresh
      setInterval(() => this.UpdateListFileDisplay(recent_files_div), 2000);
    };

    const DisplayFilesContent = () => {
      this.displayed_files = "";
      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = "";

      folder_view.innerHTML = `
      <div class="home_buttons">
        <div class="home_upload_btn" id="home_upload_btn">
          <span>Upload</span>
          <div class="upload_img_div"></div> 
        </div>
      </div>
        <div class="file_display_header">
          <div class="home_recent_header">All Files <span class="all_files_num_files_tag">(${app.api_handler.fileMeta.length} files found)</span></div>
          <div class="refresh_btn"></div>
        </div>
        <div class="recent_files_div">
      </div>`;

      const home_upload_btn = folder_view.querySelector(".home_upload_btn");
      home_upload_btn.addEventListener("click", this.OpenModal);

      const file_display_header = folder_view.querySelector(
        ".file_display_header"
      );
      file_display_header.addEventListener("click", () => {
        this.UpdateListFileDisplay(recent_files_div, false);
      });

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "Files";

      const recent_files_div = folder_view.querySelector(".recent_files_div");
      this.UpdateListFileDisplay(recent_files_div, false);

      // auto refresh
      setInterval(
        () => this.UpdateListFileDisplay(recent_files_div, false),
        2000
      );
    };

    const DisplaySettingsContent = () => {
      this.displayed_files = "";
      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = "";

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "Settings";

      // folder_view.innerHTML = `
      // <div class="home_buttons">
      //   <div class="home_upload_btn" id="home_upload_btn">
      //     <span>Upload</span>
      //     <div class="upload_img_div"></div>
      //   </div>
      // </div>
      //   <div class="home_recent_header">All Files</div>
      //   <div class="recent_files_div">
      // </div>`;

      // const home_upload_btn = folder_view.querySelector(".home_upload_btn");
      // home_upload_btn.addEventListener("click", this.OpenModal);

      // const recent_files_div = folder_view.querySelector(".recent_files_div");
      // this.UpdateListFileDisplay(recent_files_div, false);

      // // auto refresh
      // setInterval(() => this.UpdateListFileDisplay(recent_files_div, false), 2000);
    };

    const DisplayFileRequestContentsContent = () => {
      this.displayed_files = "";
      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = "";

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "File Requests";

      // folder_view.innerHTML = `
      // <div class="home_buttons">
      //   <div class="home_upload_btn" id="home_upload_btn">
      //     <span>Upload</span>
      //     <div class="upload_img_div"></div>
      //   </div>
      // </div>
      //   <div class="home_recent_header">All Files</div>
      //   <div class="recent_files_div">
      // </div>`;

      // const home_upload_btn = folder_view.querySelector(".home_upload_btn");
      // home_upload_btn.addEventListener("click", this.OpenModal);

      // const recent_files_div = folder_view.querySelector(".recent_files_div");
      // this.UpdateListFileDisplay(recent_files_div, false);

      // // auto refresh
      // setInterval(() => this.UpdateListFileDisplay(recent_files_div, false), 2000);
    };

    const DisplayAuthorisedFilesContentsContent = () => {
      this.displayed_files = "";
      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = `
      <div class="authorise_files_request_btn">Click to Request Files to Authorise</div>
      <div class="files_sections"></div>`;

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "Authorise Files";

      const authorise_files_request_btn = folder_view.querySelector(
        ".authorise_files_request_btn"
      );
      authorise_files_request_btn.addEventListener("click", async () => {
        const file_response = await app.api_handler.GetUnauthorisedFiles();
        const files_section = folder_view.querySelector(".files_sections");
        files_section.innerHTML = "";
        if (file_response.files.length < 1) {
          files_section.innerHTML = `<div>No files need to be authorised.</div>`;
        } else {
          // display files
          file_response.files?.forEach((fileMeta, index) => {
            const file_date = new Date(fileMeta.timeStamp);
            const date_string = `${file_date.toLocaleDateString()} ${file_date.toLocaleTimeString()}`;

            const file_div = document.createElement("div");
            file_div.classList.add("file_div_auth");
            file_div.innerHTML = `
            <div class="d-flex w-100 top">
              <div class="file_icon_div"></div>
                <div class="file_text">
                  <div class="file_left">
                    <div class="file_name_desc">
                      <div class="file_meta_name">
                          ${fileMeta.fileName}
                        </div>
                        <div class="file_meta_desc">
                          ${fileMeta.description}
                        </div>
                    </div>
                  </div>
                  <div class="file_right">
                    <div class="additional_meta">Uploaded at: ${date_string} by ${fileMeta.uploaded_by}</div>
                  </div>
                </div>
              </div>
            <div class="d-flex w-100 bottom">
              <div class="hover_section">
              </div>
            </div>
          `;
            files_section.append(file_div);

            const hover_section = file_div.querySelector(".hover_section");

            file_div.addEventListener("mouseenter", () => {
              hover_section.innerHTML = `
              <div class="auth_buttons">
                <div class="auth_download_button">Download</div>
                <div class="auth_btn auth_true">Authorise</div>
                <div class="auth_btn auth_false">Reject</div>
              </div>
              `;

              const download_button = hover_section.querySelector(
                ".auth_download_button"
              );
              if (download_button) {
                download_button.addEventListener("click", (e) => {
                  // console.log(e);
                  app.file_handler.DownloadFile(fileMeta.file_ID);
                });
              }

              const auth_true_btn = hover_section.querySelector(".auth_true");
              auth_true_btn.addEventListener("click", async () => {
                // file needs to be authed
                await app.api_handler.AuthoriseFile(fileMeta.file_ID);
                files_section.classList.add("fade_out");
                setTimeout(DisplayAuthorisedFilesContentsContent, 500);
              });

              const auth_false_btn = hover_section.querySelector(".auth_false");
              auth_false_btn.addEventListener("click", async () => {
                // file needs to be deleted
                await app.api_handler.DeleteFile(fileMeta.file_ID);
                files_section.classList.add("fade_out");
                setTimeout(DisplayAuthorisedFilesContentsContent, 500);
              });
            });

            file_div.addEventListener("mouseleave", () => {
              hover_section.innerHTML = "";
            });
          });
        }
      });
    };

    const explorer_links = document.querySelector(".explorer_body_links");
    explorer_links.innerHTML = `
    <ul class="links_ul">
        <li class="link" id="home_link">Home</li>
        <li class="link" id="files_link">Files</li>
        <li class="link" id="settings_link">Settings</li>
    </ul>
    <div class="link_divider"></div>
    ${app.api_handler.user_data?.Permission_Level < 2
        ? `
        <ul class="additional_links_ul">
          <li class="link" id="file_request_link">File Requests</li>
          <li class="link" id="authorise_files_link">Authorise Files</li>
        </ul>
    `
        : ""
      }
    `;

    const ClearLinkClasses = () => {
      const li_elements = explorer_links.querySelectorAll(".link");
      li_elements.forEach((el) => el.classList.remove("active"));
    };

    const home_link = explorer_links.querySelector("#home_link");
    home_link.addEventListener("click", () => {
      ClearLinkClasses();
      home_link.classList.add("active");
      DisplayHomeContent();
    });

    const files_link = explorer_links.querySelector("#files_link");
    files_link.addEventListener("click", () => {
      ClearLinkClasses();
      files_link.classList.add("active");
      DisplayFilesContent();
    });

    const settings_link = explorer_links.querySelector("#settings_link");
    settings_link.addEventListener("click", () => {
      ClearLinkClasses();
      settings_link.classList.add("active");
      DisplaySettingsContent();
    });

    const file_request_link =
      explorer_links.querySelector("#file_request_link");
    if (file_request_link) {
      file_request_link.addEventListener("click", () => {
        ClearLinkClasses();
        file_request_link.classList.add("active");
        DisplayFileRequestContentsContent();
      });
    }

    const authorise_files_link = explorer_links.querySelector(
      "#authorise_files_link"
    );
    if (authorise_files_link) {
      authorise_files_link.addEventListener("click", () => {
        ClearLinkClasses();
        authorise_files_link.classList.add("active");
        DisplayAuthorisedFilesContentsContent();
      });
    }

    // Home by default
    home_link.click();
  }
  //updates UI files
  async UpdateListFileDisplay(parent, file_limit = true) {
    const recent_file_limit = 5;
    const new_files = JSON.stringify(app.api_handler.fileMeta);
    if (this.displayed_files != new_files) {
      parent.innerHTML = "";
      let files = app.api_handler.fileMeta;
      this.displayed_files = JSON.stringify(files);

      // sort files by datetime
      if (files) {
        files = files?.sort((a, b) => {
          const a_date = new Date(a.timeStamp);
          const b_date = new Date(b.timeStamp);

          return b_date - a_date;
          // console.log(a)
        });
      }

      let limit_reached = false;

      // display files
      files?.forEach((fileMeta, index) => {
        if (limit_reached) {
          return;
        } else if (index < recent_file_limit || !file_limit) {
          const file_date = new Date(fileMeta.timeStamp);
          const date_string = `${file_date.toLocaleDateString()} ${file_date.toLocaleTimeString()}`;

          const file_div = document.createElement("div");
          file_div.classList.add("file_div");
          file_div.innerHTML = `
          <div class="file_icon_div"></div>
          <div class="file_text">
            <div class="file_left">
              <div class="file_name_desc">
                <div class="file_meta_name">
                    ${fileMeta.fileName}
                  </div>
                  <div class="file_meta_desc">
                    ${fileMeta.description}
                  </div>
              </div>
              ${
            /*
    app.api_handler.user_data.Permission_Level < 2
      ? `
  <div class="auth_icon ${
    fileMeta.authorised == 0
      ? `false`
      : fileMeta.authorised == 1
      ? "true"
      : ""
  }"></div>`
      : ""
*/
            `
              <div class="auth_icon ${fileMeta.authorised == 0
              ? `false`
              : fileMeta.authorised == 1
                ? "true"
                : ""
            }"></div>`
            }
              
              <div class="hover_section"></div>
            </div>
            <div class="file_right">
              <div class="additional_meta">Uploaded at: ${date_string} by ${fileMeta.uploaded_by
            }</div>
            </div>
          </div>
          `;
          parent.append(file_div);

          const hover_section = file_div.querySelector(".hover_section");

          file_div.addEventListener("mouseenter", () => {
            hover_section.innerHTML = `
        ${app.api_handler.user_data.Permission_Level < 3
                ? `<div class="download_button"></div>`
                : ""
              }
        <div class="view_button"></div>
        `;

            const download_button =
              hover_section.querySelector(".download_button");
            if (download_button) {
              download_button.addEventListener("click", (e) => {
                // console.log(e);
                app.file_handler.DownloadFile(fileMeta.file_ID);
              });
            }
          });

          file_div.addEventListener("mouseleave", () => {
            hover_section.innerHTML = "";
          });
        } else {
          // add see more files button here
          const see_more_div = document.createElement("div");
          // see_more_div.classList.add("");
          see_more_div.innerHTML = `
          <div class="more_files_btn">View more files</div>
          `;
          see_more_div
            .querySelector(".more_files_btn")
            .addEventListener("click", () => {
              document.querySelector("#files_link").click();
            });
          parent.append(see_more_div);
          limit_reached = true;
        }
      });
      // app.ui_handler.files_displayed = true
    }
  }

  // callback for submit button event listener
  SubmitClickCallback(selected_users) {
    app.ui_handler.SubmitClicked(selected_users);
  }
  //opens modal
  OpenModal() {
    const upload_modal = document.querySelector(".upload_modal");
    upload_modal.innerHTML = `
    <div class="modal_div">
            <div class="close_btn btn-close"></div>
            <div class="inputs">
                <div class="file_name_input_div">
                    <label class="input_name_label">Name:</label>
                    <div class="input_border">
                        <input type="text" id="file_name_input" placeholder="Name your file here..."
                            value="Test File Name">
                    </div>
                </div>
                <div class="file_description_input_div">
                    <label class="input_name_label">Description:</label>
                    <textarea id="file_description_input" cols="30" rows="3"
                        placeholder="Description of file contents (optional)"
                        ></textarea>
                </div>
                <div class="file_name_input_div">
                    <input type="file" id="file_input">
                </div>
                <div class="share_toggle">
                  <label>Share with other users?</label>
                  <input type="checkbox" id="toggle_share">
                </div>
                <div class="toggle_select_users_section"></div>
                <div class="btn submit_btn">Submit for approval</div>
            </div>
        </div>`;
    upload_modal.classList.remove("d-none");
    let selected_users = [];

    const submit_btn = upload_modal.querySelector(".submit_btn");

    const close_btn = upload_modal.querySelector(".close_btn");
    close_btn.addEventListener("click", () => {
      app.ui_handler.CloseModal();
    });

    submit_btn.addEventListener(
      "click",
      () => {
        app.ui_handler.SubmitClickCallback(selected_users);
      },
      {
        once: true,
      }
    );

    const toggle_share = upload_modal.querySelector("#toggle_share");
    const toggle_select_users_section = upload_modal.querySelector(
      ".toggle_select_users_section"
    );
    toggle_share.addEventListener("change", async () => {
      switch (toggle_share.checked) {
        case true:
          const user_data = JSON.parse(localStorage.getItem("user_data"));

          const other_users = await app.api_handler.GetOtherUsers(user_data.ID);
          toggle_select_users_section.innerHTML = `
          <ul class="other_users_ul">
          </ul>`;

          const other_users_ul =
            toggle_select_users_section.querySelector(".other_users_ul");
          for (const user of other_users) {
            const lbl_id = `lbl_${user.ID}`;
            const input_class = `input_${user.ID}`;

            const li_el = document.createElement("li");
            li_el.classList.add("other_user_li");

            const lbl_el = document.createElement("label");
            lbl_el.classList.add("other_user_lbl");
            lbl_el.id = lbl_id;
            lbl_el.textContent = user.Name;
            li_el.append(lbl_el);

            const input_el = document.createElement("input");
            input_el.type = "checkbox";
            input_el.id = input_class;
            input_el.classList.add("other_user_toggle");
            li_el.append(input_el);

            // other_users_ul.innerHTML += `
            // <li class="other_user_li">
            //   <label class="other_user_lbl" id="${lbl_id}">${user.Name}</label>
            //   <input type="checkbox" class="other_user_toggle" id="${input_class}">
            // </li>`

            // const toggle_input = other_users_ul.querySelector(`#${input_class}`)
            input_el.addEventListener("change", () => {
              switch (input_el.checked) {
                case true:
                  li_el.classList.add("selected");
                  selected_users.push(user.ID);
                  break;
                case false:
                  li_el.classList.remove("selected");
                  selected_users = selected_users.filter((_user) => {
                    if (_user != user.ID) {
                      return _user;
                    }
                  });
                  break;
              }
            });

            other_users_ul.append(li_el);
          }
          break;
        case false:
          selected_users = [];
          toggle_select_users_section.innerHTML = ``;
          break;
      }
    });
  }
  // executed once submit button is clicked
  async SubmitClicked(selected_users) {
    const file_input = document.querySelector("#file_input");
    const file_input_name = document.querySelector("#file_name_input");
    const file_input_desc = document.querySelector("#file_description_input");
    if (file_input.files.length > 0) {
      app.file_handler
        .CreateBufferArray(file_input.files[0])
        .then(async (buffer) => {
          let new_name = file_input_name.value;
          const split = file_input.files[0].name.split(".");
          new_name += `.${split[split.length - 1]}`;
          // const symmetric_key = app.encrpytion_handler.GenerateKey();
          var encrypted_buffer = await app.encrpytion_handler.EncryptFile(
            buffer
          );

          const user_data = JSON.parse(localStorage.getItem("user_data"));
          const public_key = user_data.Public_Key;
          // encrypted with public key returned from server
          const encrypted_symmetric_key = await app.encrpytion_handler.EncryptKey(
            encrypted_buffer.key,
            public_key
          );
          const OtherUserIDsAndPublicKeys =
            await app.api_handler.GetOtherUserIdsAndPublicKeys(
              user_data.ID,
              selected_users
            );

          // iterate through array of other users and their public keys, encrypt the
          // symmetric then upload the file along with the encrypted keys
          let otherUsersAndEncryptedKeys = [];
          const keyToEncrypt = encrypted_buffer.key
          for (const userWithKey of OtherUserIDsAndPublicKeys) {
            // const rsa = window.rsa(userWithKey.publicKey)
            const encrypted_symmetric_key = await app.encrpytion_handler.EncryptKey(
              keyToEncrypt,
              userWithKey.publicKey
            );
            otherUsersAndEncryptedKeys.push({
              ID: userWithKey.ID,
              EncryptedSymmetricKey: encrypted_symmetric_key
            })
          }

          const tranmission_obj = {
            name: `${new_name}`,
            type: `${file_input.files[0].type}`,
            size: `${file_input.files[0].size}`,
            description: file_input_desc?.value ?? "",
            binaryString: encrypted_buffer.data,
            client_encrypted_key: encrypted_symmetric_key,
            other_users: JSON.stringify(otherUsersAndEncryptedKeys),
            timeStamp: new Date().toISOString(),
            share_with_user_ids: selected_users,
          };
          const json_obj = JSON.stringify(tranmission_obj);
          // console.log(json_obj);

          // send data to server
          app.api_handler.UploadFile(json_obj);

          // temp
          this.CloseModal();
        });
    } else {
      this.CloseModal();
    }
  }
  CloseModal() {
    const upload_modal = document.querySelector(".upload_modal");
    upload_modal.classList.add("d-none");

    const submit_btn = document.querySelector(".submit_btn");
    submit_btn.removeEventListener(
      "click",
      app.ui_handler.SubmitClickCallback,
      {
        once: true,
      }
    );
  }
  UpdateCompanyDataUi(company_data = app.api_handler.company_data) {
    const company_name_text = document.querySelector("#company_name");
    company_name_text.textContent =
      company_data?.company_name ?? "Secure Chain";
    if (company_data?.company_logo?.data) {
      let blob = new Blob([
        new Uint8Array([...company_data?.company_logo?.data]).buffer,
      ]);
      document.querySelector(".navbar_logo").src = URL.createObjectURL(blob);
    }
  }
}

const app = new App();
