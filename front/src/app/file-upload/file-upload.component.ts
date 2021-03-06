import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToastrService,GlobalConfig } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner"; 
import { CsvgenService } from "../csvgen.service"


@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})

export class FileUploadComponent implements OnInit {
  form: FormGroup;
  toast_options: GlobalConfig;
  submitted = false;
  pattern = "^[a-zA-Z0-9]+[\.][a-zA-Z0-9.]+[a-zA-Z0-9]$"
  patternUrl = "[Hh][Tt][Tt][Pp][Ss]?://(.*)"
  file: any;
  enableUrl: boolean = false;
  url : string;

  constructor(
    public fb: FormBuilder,
    private toastr: ToastrService,
    private spinnerService: NgxSpinnerService,
    private csvgenService: CsvgenService,

  ) {
    this.form = this.fb.group({
      separator: ['',[Validators.required, Validators.maxLength(1)]],
      className: ['',[Validators.required,Validators.pattern(this.pattern)]],
      file: [null],
      url: ['',[Validators.pattern(this.patternUrl)]]
    })
    this.toast_options = this.toastr.toastrConfig;

  }

  ngOnInit() { }

  onDrop(event){
    this.uploadFile(event[0])
  }

  fromBrowser(event){
    this.uploadFile(event.target.files[0])
  }

  uploadFile(file) {
    this.form.patchValue({
      file: file
    });
    this.form.get('file').updateValueAndValidity()
    this.file = file
    var reader = new FileReader();
    var SLICE = 1024 * 1;
    var blob = file.slice(0, file.size < SLICE ? file.size : SLICE );
    reader.onload = (e) => {
      var input: HTMLInputElement = <HTMLInputElement>document.getElementById('filePreview')
      input.value = reader.result.toString();
    }
    reader.readAsText(blob);
  }

  reset() {
    this.submitted = false;
    this.form.reset();
    this.file = null;
  }

  /**
   * Delete file 
  */
  deleteFile() {
    this.file = null;
  }

  /**
   * format bytes
   * @param bytes (File size in bytes)
   * @param decimals (Decimals point)
   */
  formatBytes(bytes, decimals) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  submitForm() {

    this.submitted = true;

    
      if (this.file == null && !this.enableUrl){
        let that = this;

        that.open_toast("Error in sending File to Intersystems IRIS for Health.", "File is mandatory", "error")
        return;
      }
      if (this.form.get('url').value == null && this.enableUrl){
        let that = this;

        that.open_toast("Error in sending url to Intersystems IRIS for Health.", "Url is mandatory", "error")
        return;
      }
    if (this.form.invalid) {
      return;
    }

    var formData: any = new FormData();
    let body = {
      "separator": this.form.get('separator').value,
      "className": this.form.get('className').value,
      "url": this.form.get('url').value,
      "enableUrl" : this.enableUrl
    }
    var stringBody = JSON.stringify(body)
    formData.append("body", stringBody);
    formData.append("file", this.form.get('file').value)
    this.spinnerService.show();  
    var that = this;
    this.csvgenService.import(formData).subscribe((data: any) => {

      this.spinnerService.hide();


      that.open_toast("Success", data, "success")

      this.reset()

  }, error => {
      this.spinnerService.hide();
      console.log("There was an error importing file", error);
      let msg = ''
      if (error.error != null) {
        msg = error.error
      }
      else {
        msg = error.message
      }
      that.open_toast("Error in sending File to Intersystems IRIS for Health.", msg, "error")

  })
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }


  open_toast(title:string, message:string, type:string) {
    this.toast_options.positionClass = "toast-bottom-center"
    if (type == "success") {
        this.toast_options.disableTimeOut = true
        this.toastr.success(message, title);
    } else {
      this.toast_options.disableTimeOut = false
        this.toastr.error(message, title);
    }
}


}
