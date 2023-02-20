import { Component, OnInit, OnDestroy,Renderer2 } from "@angular/core";
import { DataStorageService } from 'src/app/core/services/data-storage.service';
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/shared/dialog/dialog.component';
import { MatDialog } from '@angular/material';
import { saveAs } from 'file-saver';
import { AuditService } from "src/app/core/services/audit.service";

@Component({
  selector: "app-trackservicerequest",
  templateUrl: "trackservicerequest.component.html",
  styleUrls: ["trackservicerequest.component.css"],
})
export class TrackservicerequestComponent implements OnInit, OnDestroy {
  langJSON:any;
  popupMessages:any;
  subscriptions: Subscription[] = [];
  eidVal:string = "";
  eidStatus:any;
  message:string;
  errorCode:string;
  isPopUpShow:boolean = false;
  iconBtnClicked:boolean = false;
  infoText:string;
  disableTrackBtn:boolean = true;

  constructor(private renderer:Renderer2 ,private dialog: MatDialog, private appConfigService: AppConfigService, private dataStorageService: DataStorageService, private translateService: TranslateService, private router: Router, private route: ActivatedRoute,private auditService: AuditService) {
    this.renderer.listen('window','click',(e:Event) =>{
       if(!this.iconBtnClicked){
          this.isPopUpShow = false
       }
       this.iconBtnClicked = false
    })
  }

  async ngOnInit() {
    this.translateService.use(localStorage.getItem("langCode"));

    this.route.queryParams
      .subscribe(params => {
        this.eidVal = params.eid;
        this.getEIDStatus();
      }
    );  
    if(this.eidVal){
        this.disableTrackBtn = this.eidVal.length === 16 ? false : true
    }

    this.translateService
    .getTranslation(localStorage.getItem("langCode"))
    .subscribe(response => {
      this.langJSON = response;
      console.log(this.langJSON)
      this.popupMessages = response;
      this.infoText = response.InfomationContent.trackStatus
    }); 
  }

  captureValue(event: any, formControlName: string) {
    this[formControlName] = event.target.value;
    this.disableTrackBtn = event.target.value.length === 16 ? false : true;
  }

  getEIDStatus(){
    this.auditService.audit('RP-026', 'Track Service Request', 'RP-Track Service Request', 'Track Service Request', 'User clicks on "search" button');
    if(this.eidVal){
    this.dataStorageService
    .getEIDStatus(this.eidVal)
    .subscribe((response) => {
      console.log(response)
      if(response["response"]){
        this.eidStatus = response["response"];
      }else if(response["errors"]){
        this.showErrorPopup(response["errors"])
      }
        
    });
  }
  }

  downloadAcknowledgement(){
    this.dataStorageService
    .downloadAcknowledgement(this.eidVal)
    .subscribe(data => {
      var fileName = this.eidVal+".pdf";
      const contentDisposition = data.headers.get('Content-Disposition');
      if (contentDisposition) {
        const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = fileNameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }
      saveAs(data.body, fileName);
    },
    err => {
      console.error(err);
    });
  }

  showMessage(message: string) {    
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '850px',
      data: {
        case: 'MESSAGE',
        title: this.popupMessages.genericmessage.successLabel,
        message: message,
        btnTxt: this.popupMessages.genericmessage.successButton
      }
    });
    return dialogRef;
  }

  showErrorPopup(message: string) {
    this.errorCode = message[0]["errorCode"]
    if(this.errorCode === "RES-SER-410"){
      let errorMessageType = message[0]["message"].split("-")[1].trim()
      this.message = this.popupMessages.serverErrors[this.errorCode][errorMessageType]
    }else{
      this.message = this.popupMessages.serverErrors[this.errorCode]
    }
  
    this.dialog
      .open(DialogComponent, {
        width: '550px',
        data: {
          case: 'MESSAGE',
          title: this.popupMessages.genericmessage.errorLabel,
          message: this.message,
          btnTxt: this.popupMessages.genericmessage.successButton
        },
        disableClose: true
      });
  }

  downloadVIDCard(eventId:any){
    this.dataStorageService.downloadVidCardStatus(eventId).subscribe(response =>{
     let fileName = ""
     const contentDisposition = response.headers.get('Content-Disposition');
     console.log(contentDisposition)
     if (contentDisposition) {
       const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
       const matches = fileNameRegex.exec(contentDisposition);
       if (matches != null && matches[1]) {
         fileName = matches[1].replace(/['"]/g, '');
       }
     }
     saveAs(response.body, fileName);
    })
 }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  onItemSelected(item: any) {
    this.router.navigate([item]);
  }
  navigateGrievance(eventId:any){
    this.router.navigate(["grievanceRedressal"],{state:{eventId:eventId}})
  }

  openPopupMsg(){
    this.isPopUpShow = !this.isPopUpShow
  }
  preventCloseOnClick(){
    this.iconBtnClicked = true
  }
}