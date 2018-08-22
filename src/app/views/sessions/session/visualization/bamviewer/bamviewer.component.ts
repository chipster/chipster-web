import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import Dataset from "chipster-js-common";
import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import * as pako from "pako";
import BamRecord from "./bamRecord";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../../../../model/loadstate";


@Component({
  selector: 'ch-bam-viewer',
  templateUrl: 'bamviewer.html',
  styleUrls: ['./bamviewer.component.less'],

})
export class BamViewerComponent implements OnChanges, OnDestroy {

  @Input()
  private dataset: Dataset;
  private plain: any;
  private samHeaderLen: number;
  private samHeader = "";
  private headerEnd: number;
  private samHeaderList:Array<string>=[];
  private bamRecordList: Array<BamRecord> = [];
  private chrName: string;
  private bamRecord: BamRecord;
  private visibleBlockNumber = 2;//just a magic number,just showing records from first two blocks
  private maxBytes= 5000000;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  //BGZF blocks
  private BLOCK_HEADER_LENGTH = 18;
  private filePos = 0;
  private blockList = [];

  constructor(private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private errorHandlerService: RestErrorService) {
  }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading bam file...");

    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset, this.maxBytes, true)
      .takeUntil(this.unsubscribe)
      .subscribe((result: any) => {

        var arrayBuffer = result;

        if (arrayBuffer) {
          //let determine the header block size to decode the header and the record part differently

          let blockHeader = arrayBuffer.slice(this.filePos, this.BLOCK_HEADER_LENGTH + this.filePos);
          let ba = new Uint8Array(blockHeader);
          let blockSize = (ba[17] << 8) | (ba[16]) + 1;

          let headerBuffer = arrayBuffer.slice(0, blockSize-1);
          let recordBuffer = arrayBuffer.slice(blockSize);


          //Read the header part
          this.readHeader(headerBuffer);
          //Read the record buffer
          this.getBGZFBlocks(recordBuffer);

          this.state = new LoadState(State.Ready);
        }
      }, ( error: any) => {
        this.state = new LoadState(State.Fail, "Loading bam file failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Decode the BAM File Header
  readHeader(headerBuffer: ArrayBuffer) {

    let headerPart = new Uint8Array(headerBuffer);
    let header = pako.inflate(headerPart);
    this.samHeaderLen = this.readInt(header, 4);

    for (var i = 0; i < this.samHeaderLen; ++i) {
      this.samHeader+= String.fromCharCode(header[i + 8]);
    }

    // In cases where SAM header text section is missing or not containing seq information
    if(this.samHeaderLen==0||this.samHeader.indexOf("@SQ")==-1){
      //#ref sequence
      let nRef = this.readInt(header, this.samHeaderLen + 8);
      let p = this.samHeaderLen + 12;

      for (var i = 0; i < nRef; ++i) {
        //lName=length of the reference nameplus 1
        let lName = this.readInt(header, p);

        let name = "";
        for (var j = 0; j < lName - 1; ++j) {
          name += String.fromCharCode(header[p + 4 + j]);
        }


        this.chrName = name;
        //lRef= length of the reference sequence
        let lRef = this.readInt(header, p + lName + 4);
        this.samHeader+= "@SQ"+ " "+"SN" +":" +" "+ name+" "+"LN:"+ lRef+ " ";

        p = p + 8 + lName;
        this.headerEnd = p;

      }
    }
    this.updateHeaderText();

  }

  updateHeaderText(){

    let a=this.samHeader.split("@");
    for(var i=1,j=0;i<a.length;i++,j++){
      this.samHeaderList[j]="@"+a[i];
    }

  }

  getBGZFBlocks(arrayBuffer: ArrayBuffer) {

    let fileLimit = arrayBuffer.byteLength - 18;

    let totalSize = 0;
    let blockSizeList = [];


    while (this.filePos < fileLimit) {
      let blockHeader = arrayBuffer.slice(this.filePos, this.BLOCK_HEADER_LENGTH + this.filePos);
      let ba = new Uint8Array(blockHeader);
      let blockSize = (ba[17] << 8) | (ba[16]) + 1;
      if (blockSize < 28) break;

      blockSizeList.push(blockSize);



      let compressedData = arrayBuffer.slice(this.filePos, this.filePos + this.BLOCK_HEADER_LENGTH + blockSize);
      totalSize += compressedData.byteLength;


      //some blocks still behave differently, so pako still throws some error as incorrect header check
      try {
        let unCompressedData = pako.inflate(new Uint8Array(compressedData));
        this.blockList.push(unCompressedData);
      } catch (e) {
        //console.log(e);
        break;
      }

      this.filePos += blockSize;

    }

    let i;

    if (this.blockList.length > 0) {
      for (i = 0; i < this.visibleBlockNumber; ++i) {
        this.decodeBamRecord(this.blockList[i]);
      }
    }


  }

  decodeBamRecord(unComperessedData: any) {
    this.plain = unComperessedData;
    const MAX_GZIP_BLOCK_SIZE = 65536;
    let offset = 0;

    while (true) {
      this.bamRecord = new BamRecord();
      let blockSize, blockEnd, refID, pos, bmn, bin, mq, nl, flag_nc, flag, nc, lseq, nextRefID,
        nextPos, readName, j, p, lengthOnRef, cigar, c, cigarArray, seq, seqBytes;

      let CIGAR_DECODER = ['M', 'I', 'D', 'N', 'S', 'H', 'P', '=', 'X', '?', '?', '?', '?', '?', '?', '?'];
      let SECRET_DECODER = ['=', 'A', 'C', 'x', 'G', 'x', 'x', 'x', 'T', 'x', 'x', 'x', 'x', 'x', 'x', 'N'];

      if (offset >= this.plain.length) {
        return;
      }

      blockSize = this.readInt(this.plain, offset);
      blockEnd = offset + blockSize + 4;


      if (blockSize > MAX_GZIP_BLOCK_SIZE||blockEnd>MAX_GZIP_BLOCK_SIZE) {
        this.state = new LoadState(State.Fail, "Loading the Bam records failed");
        return;
      }


      refID = this.readInt(this.plain, offset + 4);
      pos = this.readInt(this.plain, offset + 8);


      if (refID < 0) {
        this.state = new LoadState(State.Fail, "Loading the Bam records failed");
        return;
      }

      bmn = this.readInt(this.plain, offset + 12);
      bin = (bmn & 0xffff0000) >> 16;
      mq = (bmn & 0xff00) >> 8;
      nl = bmn & 0xff;

      flag_nc = this.readInt(this.plain, offset + 16);
      flag = (flag_nc & 0xffff0000) >> 16;
      nc = flag_nc & 0xffff;


      lseq = this.readInt(this.plain, offset + 20);
      nextRefID = this.readInt(this.plain, offset + 24);
      nextPos = this.readInt(this.plain, offset + 28);


      readName = "";
      for (j = 0; j < nl - 1; ++j) {
        readName += String.fromCharCode(this.plain[offset + 36 + j]);
      }

      p = offset + 36 + nl;
      lengthOnRef = 0;
      cigar = '';


      //nc Number of cigarOpp

      cigarArray = [];
      for (c = 0; c < nc; ++c) {
        var cigop = this.readInt(this.plain, p);
        // what is the uppermost byte?
        //var opLen = ((cigop & 0x00ffffff) >> 4);
        var opLen = (cigop  >> 4);
        var opLtr = CIGAR_DECODER[cigop & 0xf];
        if (opLtr == 'M' || opLtr == 'EQ' || opLtr == 'X' || opLtr == 'D' || opLtr == 'N' || opLtr == '=')
          lengthOnRef += opLen;
        cigar = cigar + opLen + opLtr;
        p += 4;
        cigarArray.push({len: opLen, ltr: opLtr});

      }
      this.bamRecord.cigar = cigar;

      seq = '';
      seqBytes = (lseq + 1) >> 1;
      for (j = 0; j < seqBytes; ++j) {
        //Getting the higher and lower four bits as each character is decoded with 4 bits
        var sb = this.plain[p + j];
        seq += SECRET_DECODER[(sb & 0xf0) >> 4];
        seq += SECRET_DECODER[(sb & 0x0f)];
      }

      //seq might have one extra character(if lseq is an odd number)
      seq = seq.substring(0, lseq);

      p += seqBytes;

      // Decoding the base Quality
      let self = this;
      let qual = '';

      if (lseq === 1 && String.fromCharCode(this.plain[p + j] + 33) === "*") {
        //Something something
      } else {
        for (j = 0; j < lseq; ++j) {
          qual += String.fromCharCode(this.plain[p + j] + 33);
        }

      }

      p += lseq;

      //Reading the type tags
      let value, typeTag = '';
      let tags = {};

      while (p < this.plain.length) {

        let tag = String.fromCharCode(this.plain[p], this.plain[p + 1]);
        let type = String.fromCharCode(this.plain[p + 2]);


        if (type == 'A') {
          value = String.fromCharCode(this.plain[p + 3]);
          p += 4;
        } else if (type == 'i' || type == 'I') {
          value = this.readInt(this.plain, p + 3);
          p += 7;
        } else if (type == 'c' || type == 'C') {
          value = this.plain[p + 3];
          p += 4;
        } else if (type == 's' || type == 'S') {
          value = this.readShort(p + 3);
          p += 5;
        } else if (type == 'f') {
          value = this.readFloat(p + 3);
          p += 7;
        } else if (type == 'Z' || type == 'H') {
          p += 3;
          value = '';
          for (; ;) {
            var cc = this.plain[p++];
            if (cc == 0) {
              break;
            } else {
              value += String.fromCharCode(cc);
            }
          }
        } else {
          //Unknown type
          value = "Error unknown type" + type;
          break;
        }
        tags[tag] = type + " " + value;


      }


      p += blockEnd;
      offset = blockEnd;


      for (var x in tags) {
        if (tags.hasOwnProperty(x)) {
          typeTag += x + ":" + tags[x] + " ";
        }
      }
      // In Sam file all the cCsSiIf are considered to be integer
      typeTag = typeTag.replace(/[c|C|s|S|i|I|f]/g, "i");


      //assign the bam record fields
      this.bamRecord.flag = flag;
      this.bamRecord.pos = pos + 1;
      this.bamRecord.nextSegment = nextRefID;
      this.bamRecord.nextSegPos = nextPos + 1;
      this.bamRecord.readName = readName;
      this.bamRecord.seq = seq;
      this.bamRecord.qual = qual;
      this.bamRecord.chrName = this.chrName;
      this.bamRecord.mapQ = mq;
      this.bamRecord.typeTag = typeTag;


      this.bamRecordList.push(this.bamRecord);

    }


  }

  // Utility Functions
  readInt(ba, offset) {
    return (ba[offset + 3] << 24) | (ba[offset + 2] << 16) | (ba[offset + 1] << 8) | (ba[offset]);
  }

  readByte(offset) {
    return this.plain[offset];
  }

  readShort(offset) {
    return (this.plain[offset + 1] << 8) | (this.plain[offset]);
  }

  readFloat(offset) {
    let dataView = new DataView(this.plain.buffer),
      littleEndian = true;
    return dataView.getFloat32(offset, littleEndian);
  }


}
