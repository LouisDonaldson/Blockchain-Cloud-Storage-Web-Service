class App {
  constructor() {
    this.data_retrieval_refresh_rate = 5000;
    this.file_handler = new FileHandler();
    this.api_handler = new ApiHandler();
    this.encrpytion_handler = new EncrpytionHandler();
    // console.log(this.encrpytion_handler.GenerateKey().toString());
    window.addEventListener("DOMContentLoaded", () => {
      this.ui_handler = new UiHandler();
    });
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
        const encrypted_string = app.encrpytion_handler.EncryptFile(array);

        resolve(encrypted_string);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  async DownloadFile(file_id) {
    const response = await app.api_handler.RequestFileData(file_id);
    const file_byte_arr = response.file_data;

    var new_buffer = await app.encrpytion_handler.DecryptFile(
      file_byte_arr.data
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
    const user_data = JSON.parse(localStorage.getItem("user_data"));

    // key used to encrypt data
    var shared_key = user_data.Shared_Key;

    // encrypted = encrypted data
    var encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(buffer.toString()),
      shared_key
    );

    const encrypted_key = await this.EncryptKey(shared_key);
    return { data: encrypted.toString(), encrypted_key: encrypted_key };

    // responsible for successfully decrypting data
    // var bytes = CryptoJS.AES.decrypt(encrypted, shared_key);
    // var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  async EncryptKey(key) {
    const file_password = prompt(
      "Enter password that you want to encrypt the file with:"
    );

    var encrypted_key = key;
    return encrypted_key;
  }

  async DecryptKey(encrypted_key) {
    const file_password = prompt("Enter password used to encrpyt the file:");
  }

  async DecryptFile(buffer) {
    const user_data = JSON.parse(localStorage.getItem("user_data"));

    // key used to encrypt data
    var shared_key = user_data.Shared_Key;

    let data_string = "";

    for (const char in buffer) {
      data_string += String.fromCharCode(buffer[char]);
    }

    // responsible for successfully decrypting data
    var bytes = CryptoJS.AES.decrypt(data_string, shared_key);

    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    // const new_buffer = new ArrayBuffer(bytes.length);
    // var view = new Uint8Array(new_buffer);
    // var file_data_entries = bytes;
    // for (const i in file_data_entries) {
    //   view[i] = file_data_entries[i][1];
    // }

    return decryptedData;
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
      // document.cookie = "test"
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

    const explorer_links = document.querySelector(".explorer_body_links");
    explorer_links.innerHTML = `
    <ul class="links_ul">
        <li class="link" id="home_link">Home</li>
        <li class="link" id="files_link">Files</li>
        <li class="link" id="settings_link">Settings</li>
    </ul>
    <div class="link_divider"></div>
    ${
      app.api_handler.user_data?.Permission_Level < 2
        ? `<ul class="additional_links_ul">
        <li class="link" id="file_request_link">File Requests</li>
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
              <div class="auth_icon ${
                fileMeta.authorised == 0
                  ? `false`
                  : fileMeta.authorised == 1
                  ? "true"
                  : ""
              }"></div>`
              }
              
              <div class="hover_section"></div>
            </div>
            <div class="file_right">
              <div class="additional_meta">Uploaded at: ${date_string} by ${
            fileMeta.uploaded_by
          }</div>
            </div>
          </div>
          `;
          parent.append(file_div);

          const hover_section = file_div.querySelector(".hover_section");

          file_div.addEventListener("mouseenter", () => {
            hover_section.innerHTML = `
        ${
          app.api_handler.user_data.Permission_Level < 3
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
  SubmitClickCallback() {
    app.ui_handler.SubmitClicked();
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
                <div class="btn submit_btn">Submit for approval</div>
            </div>
        </div>`;
    upload_modal.classList.remove("d-none");

    const submit_btn = upload_modal.querySelector(".submit_btn");

    const close_btn = upload_modal.querySelector(".close_btn");
    close_btn.addEventListener("click", () => {
      app.ui_handler.CloseModal();
    });

    submit_btn.addEventListener("click", app.ui_handler.SubmitClickCallback, {
      once: true,
    });
  }
  // executed once submit button is clicked
  async SubmitClicked() {
    const file_input = document.querySelector("#file_input");
    const file_input_name = document.querySelector("#file_name_input");
    const file_input_desc = document.querySelector("#file_description_input");
    if (file_input.files.length > 0) {
      app.file_handler
        .CreateBufferArray(file_input.files[0])
        .then((key_and_buffer) => {
          let new_name = file_input_name.value;
          new_name += `.${file_input.files[0].name.split(".")[1]}`;
          const tranmission_obj = {
            name: `${new_name}`,
            type: `${file_input.files[0].type}`,
            size: `${file_input.files[0].size}`,
            description: file_input_desc?.value ?? "",
            binaryString: key_and_buffer.data,
            encrypted_key: key_and_buffer.encrypted_key,
            timeStamp: new Date().toISOString(),
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
