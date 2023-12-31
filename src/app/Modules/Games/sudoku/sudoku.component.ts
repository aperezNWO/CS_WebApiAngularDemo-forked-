import { Component, OnInit            } from '@angular/core';
import { ViewChild, AfterViewInit     } from '@angular/core';
import { FormBuilder, Validators      } from '@angular/forms';
import { HttpEventType, HttpResponse  } from '@angular/common/http';
import { AlgorithmService             } from 'src/app/Services/algorithm.service';
import { Observable                   } from 'rxjs';
import { ListItem                     } from '../../../Models/algorithm-models.model';
import { PdfEngine } from 'src/app/Models/pdf-engine.model';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
//
@Component({
  selector: 'app-sudoku',
  templateUrl: './sudoku.component.html',
  styleUrl: './sudoku.component.css',
})
export class SudokuComponent implements OnInit, AfterViewInit {
  //
  board: number[][] = [];
  //
  protected tituloListadoLenguajes : string = 'Seleccione Backend';
  protected btnGenerateCaption     : string = '[GENERAR]';
  protected btnSolveCaption        : string = '[RESOLVER]';
  //
  protected tituloGenerarDesde    : string = 'Generar Desde';
  //
  @ViewChild('_languajeList') _languajeList   : any;
  @ViewChild('_SourceList')   _sourceList     : any;
  @ViewChild('_fileUpload')   _fileUpload     : any;
  @ViewChild('_sudoku_board')  _sudoku_board  : any;
    //
  public __languajeList: any;  
  //
  public __generateSourceList : any;
  //
  public _cppSourceDivHidden: boolean = true;
  public _fileUploadDivHidden:boolean = true;
  //
  public sudokuSolved: boolean = true;
  //
  public _sudokuGenerated: string = '';
  //-------------------------------------------------
  // file upload
  //-------------------------------------------------
  selectedFiles?   : FileList;
  currentFile?     : File;
  progress         : number = 0;
  message          : string = '';
  downloadLink     : string = '';
  //
  rf_searchForm   = this.formBuilder.group({
    _fileUpload   : ["", Validators.required],
  });
  pageTitle       : string = '[SUDOKU]';
  //
  constructor(private algorithmService: AlgorithmService,private formBuilder: FormBuilder) {
    //
    console.log('[SUDOKU - INGRESO]');
  }
  //
  ngAfterViewInit(): void {
    //
  }
  //
  ngOnInit(): void {
    //-----------------------------------------------------------------------------
    // LENGUAJES DE PROGRAMACION
    //-----------------------------------------------------------------------------
    this.__languajeList = new Array();
    this.__languajeList.push(new ListItem(0, '(SELECCIONE OPCION..)', false));
    this.__languajeList.push(new ListItem(1, '(.NET Core/C++)', true));
    this.__languajeList.push(new ListItem(2, '(Node.js)'      , false));
    //
    this._cppSourceDivHidden = false;
    //
    this.__generateSourceList = new Array();
    this.__generateSourceList.push(new ListItem(0, '(SELECCIONE OPCION..)', false));
    this.__generateSourceList.push(new ListItem(1, '[Desde Archivo]'      , false));
    this.__generateSourceList.push(new ListItem(2, '[Desde Backend]'      , true));
  }
  //
  public _cppSourceDivHiddenChanged(): void {
    //
    console.log('SUDOKU - [DIV CPP SOURCE CHANGED]');
    //
    let _selectedIndex: number =
      this._languajeList.nativeElement.options.selectedIndex;
    this._cppSourceDivHidden = _selectedIndex != 1; // item 1 = "c++"
    //
    this.message = "";
  }
  //
  public _fileUploadDivHiddenChanged(): void {
    //
    console.log('SUDOKU - [DIV FILEUPLOAD CHANGED]');
    //
    let _selectedIndex: number =
      this._sourceList.nativeElement.options.selectedIndex;
    this._fileUploadDivHidden = _selectedIndex != 1; // item 1 = "Desde Archivo"
    //
    this.message = "";
  }
  //
  public GenerateFromBackend():void {
        //
        console.log('[SUDOKU - GENERATE FROM BACKEND]');
        //
        let generatedSudoku: Observable<string>;
        let selectedIndex  : number = this._languajeList.nativeElement.options.selectedIndex; // c++ by default
        //
        switch (selectedIndex) {
          case 1: // c++
            generatedSudoku = this.algorithmService._GetSudoku();
            break;
          case 2: // Typescript
            generatedSudoku = this.algorithmService._GetSudoku_NodeJS();
            break;
          default:
            return;
        }
        //
        this.sudokuSolved = false;
        //
        this.btnGenerateCaption = '[...generando...]';
        //
        const generatedSudokuObserver = {
          next: (jsondata: string) => {
            //
            console.log('[SUDOKU - GENERATE] - (return): ' + jsondata);
            //
            this._sudokuGenerated = jsondata;
            //
            jsondata = jsondata.replaceAll('[', '');
            jsondata = jsondata.replaceAll(']', '');
            jsondata = jsondata.replaceAll('},', '|');
            jsondata = jsondata.replaceAll('{', '');
            jsondata = jsondata.replaceAll('}', '');
            let jsonDataArray: string[] = jsondata.split('|');
            //
            this.board = [];
            //
            for (let i = 0; i < 9; i++) {
              const row: number[] = [];
              console.log(jsonDataArray[i]);
              const rowString: string[] = jsonDataArray[i].split(',');
              for (let j = 0; j < 9; j++) {
                row.push(parseInt(rowString[j]));
              }
              this.board.push(row);
            }
          },
          error: (err: Error) => {
            //
            console.error(
              '[SUDOKU - GENERATE] - (ERROR) : ' + JSON.stringify(err.message),
            );
            //
            this.btnGenerateCaption = '[GENERAR]';
          },
          complete: () => {
            //
            console.log('[SUDOKU - GENERATE] -  (COMPLETE)');
            //
            this.btnGenerateCaption = '[GENERAR]';
            //
            this.message            =  "[Se generó correctamente]";
          },
        };
        //
        generatedSudoku.subscribe(generatedSudokuObserver);
  };
  //------------------------------------------------------
  // FILE UPLOAD METHODS / EVEND HANDLERS
  //------------------------------------------------------
  //
  selectFile(event: any): void {
    this.selectedFiles = event.target.files;
  }
  //
  upload(): void {
    //
    console.log('[SUDOKU - GENERATE  FROM FILE]');
    //
    if (this.selectedFiles) {
      const file: File | null = this.selectedFiles.item(0);
      //
      if (file) {
        //
        this.progress = 0;
        //
        this.message = '...cargando...';
        //
        this.sudokuSolved = false;
        //
        this.btnGenerateCaption = '[...generando...]';       
        //
        this.currentFile = file;
        //
        this.algorithmService.uploadSudoku(this.currentFile).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              //
              this.progress = Math.round((100 * event.loaded) / event.total);
            } else if (event instanceof HttpResponse) {
              //
              console.log('RESPONSE : ' + event.body);
              //
              let  jsondata  = event.body;
              //
              jsondata = jsondata.replaceAll('\"', '');
              jsondata = jsondata.replace(/\\r/g, '');
              jsondata = jsondata.replace(/\\n/g, '');
              //
              this._sudokuGenerated = jsondata;
              //  
              jsondata = jsondata.replaceAll('[', '');
              jsondata = jsondata.replaceAll(']', '');
              jsondata = jsondata.replaceAll('},', '|');
              jsondata = jsondata.replaceAll('{', '');
              jsondata = jsondata.replaceAll('}', '');
              let jsonDataArray: string[] = jsondata.split('|');
              //
              this.board = [];
              //
              for (let i = 0; i < 9; i++) {
                const row: number[] = [];
                console.log(jsonDataArray[i]);
                const rowString: string[] = jsonDataArray[i].split(',');
                for (let j = 0; j < 9; j++) {
                  row.push(parseInt(rowString[j]));
                }
                this.board.push(row);
              }
            }
          },
          error: (err: any) => {
            //
            console.error('[SUDOKU - GENERATE  FROM FILE] -  (ERROR)');
            //
            console.error(err);
            //
            this.progress = 0;
            //
            if (err.error && err.error.message) {
              //
              this.message = err.error.message;
            } else {
              //
              this.message = '[Could not upload the file!]';
            }
            //
            this.currentFile = undefined;
            //
            this.btnGenerateCaption = '[GENERAR]';
          },
          complete: () => {
            //
            console.log('[SUDOKU - GENERATE  FROM FILE] -  (COMPLETE)');
            //
            this.btnGenerateCaption = '[GENERAR]';
            //
            this.message          = "[Se generó correctamente]";
            //
            this.selectedFiles = undefined;
            //
            this.currentFile   = undefined;
          },
        });
      }
    }
    else 
    {
        //
        this.message          = "[Favor seleccione archivo...]";
    }
  }
  //
  public _GetSudoku(): void {
      //
      console.log('[SUDOKU - GENERATE - MAIN MENU]');
      //
      let selectedIndex  : number = this._sourceList.nativeElement.options.selectedIndex; // "FROM ARCHIVE" by default
      //
      switch (selectedIndex) {
        case 1: // FROM ARCHIVE
          this.upload();
          break;
        case 2: // FROM BACKEND
          this.GenerateFromBackend();
          break;
        default:
          return;
      }
      
  }
  //
  public _SolveSudoku(): void {
    //
    console.log('[SUDOKU - SOLVE] \n' + this._sudokuGenerated);
    //
    this.sudokuSolved = true;
    //
    this.btnSolveCaption = '[...resolviendo...]';
    //
    let solveSudoku: Observable<string>;
    //
    let selectedIndex: number =
      this._languajeList.nativeElement.options.selectedIndex; // c++ by default
    //
    switch (selectedIndex) {
      case 1: // c++
        solveSudoku = this.algorithmService._SolveSudoku(this._sudokuGenerated);
        break;
      case 2: // Typescript
        solveSudoku = this.algorithmService._SolveSudoku_NodeJS(
          this._sudokuGenerated,
        );
        break;
      default:
        return;
    }
    //
    const solveSudokuObserver = {
      next: (jsondata: string) => {
        //
        console.log('[SUDOKU - SOLVE] - (return): ' + jsondata);
        //
        this._sudokuGenerated = jsondata;
        //
        jsondata = jsondata.replaceAll('[', '');
        jsondata = jsondata.replaceAll(']', '');
        jsondata = jsondata.replaceAll('},', '|');
        jsondata = jsondata.replaceAll('{', '');
        jsondata = jsondata.replaceAll('}', '');
        let jsonDataArray: string[] = jsondata.split('|');
        //
        this.board = [];
        //
        for (let i = 0; i < 9; i++) {
          const row: number[] = [];
          console.log(jsonDataArray[i]);
          const rowString: string[] = jsonDataArray[i].split(',');
          for (let j = 0; j < 9; j++) {
            row.push(parseInt(rowString[j]));
          }
          this.board.push(row);
        }
      },
      error: (err: Error) => {
        //
        console.error(
          '[SUDOKU - SOLVE] - (ERROR) : ' + JSON.stringify(err.message),
        );
        //
        this.message = "[Ha ocurrido un error]";
      },
      complete: () => {
        //
        console.log('[SUDOKU - SOLVE] -  (COMPLETE)');
        //
        this.btnSolveCaption = '[RESOLVER]';
        //
        this.message = "[Se resolvió correctamente]";
        //
        this.selectedFiles = undefined;
        //
        this.currentFile   = undefined;
        //
        this.rf_searchForm.reset();
      },
    };
    //
    solveSudoku.subscribe(solveSudokuObserver);
  }
  //
  _GetPdf() {
    //
    console.log(this.pageTitle + ": [GENERANDO PDF]" );
    //
    const areaToPrint = this._sudoku_board.nativeElement; // Replace with your HTML area's ID
    //
    html2canvas(areaToPrint).then((canvas) => {
      //
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 size
  
      const imgWidth = 210; // A4 size
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('generated.pdf');
    });
  }
}
