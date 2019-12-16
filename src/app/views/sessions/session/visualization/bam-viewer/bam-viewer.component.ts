import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as pako from "pako";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../session-data.service";
import BamRecord from "./bamRecord";

@Component({
  selector: "ch-bam-viewer",
  templateUrl: "bam-viewer.component.html",
  styleUrls: ["./bam-viewer.component.less"]
})
export class BamViewerComponent implements OnChanges, OnDestroy {
  @Input()
  private dataset: Dataset;
  private plain: any;
  private samHeaderLen: number;
  private samHeader;
  private headerEnd: number;
  private samHeaderList: Array<string>;

  private bamRecordList: BamRecord[];

  private chrName: string;
  private visibleBlockNumber = 2; // just a magic number,just showing records from first two blocks
  private maxBytes = 500000;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  // BGZF blocks
  private BLOCK_HEADER_LENGTH = 18;
  private filePos;
  private blockList;

  private disabled = false;

  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private errorHandlerService: RestErrorService
  ) {
    this.bamRecordList = new Array<BamRecord>();
  }

  ngOnChanges() {
    if (this.disabled) {
      return;
    }
    this.samHeaderList = [];
    this.filePos = 0;
    this.blockList = [];
    this.bamRecordList = [];
    this.samHeader = "";
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading bam file...");

    this.fileResource
      .getData(
        this.sessionDataService.getSessionId(),
        this.dataset,
        this.maxBytes,
        true
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: any) => {
          const arrayBuffer = result;

          if (arrayBuffer) {
            // let determine the header block size to decode the header and the record part differently

            const blockHeader = arrayBuffer.slice(
              this.filePos,
              this.BLOCK_HEADER_LENGTH + this.filePos
            );
            const ba = new Uint8Array(blockHeader);
            const blockSize = (ba[17] << 8) | (ba[16] + 1);

            const headerBuffer = arrayBuffer.slice(0, blockSize - 1);
            const recordBuffer = arrayBuffer.slice(blockSize);

            // Read the header part
            this.readHeader(headerBuffer);
            // Read the record buffer
            this.getBGZFBlocks(recordBuffer);
            this.state = new LoadState(
              State.Ready,
              "Loading Bam file complete"
            );
          }
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading bam file failed");
          this.errorHandlerService.showError(this.state.message, error);
        }
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  // Decode the BAM File Header
  readHeader(headerBuffer: ArrayBuffer) {
    const headerPart = new Uint8Array(headerBuffer);
    const header = pako.inflate(headerPart);
    this.samHeaderLen = this.readInt(header, 4);

    for (let i = 0; i < this.samHeaderLen; ++i) {
      this.samHeader += String.fromCharCode(header[i + 8]);
    }

    // In cases where SAM header text section is missing or not containing seq information
    if (this.samHeaderLen === 0 || this.samHeader.indexOf("@SQ") === -1) {
      // #ref sequence
      const nRef = this.readInt(header, this.samHeaderLen + 8);
      let p = this.samHeaderLen + 12;

      for (let i = 0; i < nRef; ++i) {
        // lName=length of the reference nameplus 1
        const lName = this.readInt(header, p);

        let name = "";
        for (let j = 0; j < lName - 1; ++j) {
          name += String.fromCharCode(header[p + 4 + j]);
        }

        this.chrName = name;
        // lRef= length of the reference sequence
        const lRef = this.readInt(header, p + lName + 4);
        this.samHeader +=
          "@SQ" + " " + "SN" + ":" + " " + name + " " + "LN:" + lRef + " ";

        p = p + 8 + lName;
        this.headerEnd = p;
      }
    }
    // this.updateHeaderText();
  }

  updateHeaderText() {
    // console.log(this.samHeader);

    const a = this.samHeader.split("@");
    for (let i = 1, j = 0; i < a.length; i++, j++) {
      this.samHeaderList[j] = "@" + a[i];
    }
  }

  getBGZFBlocks(arrayBuffer: ArrayBuffer) {
    const fileLimit = arrayBuffer.byteLength - 18;
    let totalSize = 0;
    const blockSizeList = [];

    while (this.filePos < fileLimit) {
      const blockHeader = arrayBuffer.slice(
        this.filePos,
        this.BLOCK_HEADER_LENGTH + this.filePos
      );
      const ba = new Uint8Array(blockHeader);
      const blockSize = (ba[17] << 8) | (ba[16] + 1);
      if (blockSize < 28) {
        break;
      }

      blockSizeList.push(blockSize);

      const compressedData = arrayBuffer.slice(
        this.filePos,
        this.filePos + this.BLOCK_HEADER_LENGTH + blockSize
      );
      totalSize += compressedData.byteLength;

      // some blocks still behave differently, so pako still throws some error as incorrect header check
      try {
        const unCompressedData = pako.inflate(new Uint8Array(compressedData));
        this.blockList.push(unCompressedData);
      } catch (e) {
        // console.log(e);
        break;
      }

      this.filePos += blockSize;
    }

    if (this.blockList.length > 0) {
      this.decodeBamRecord(this.blockList[0]);
    }

    return null;
  }

  decodeBamRecord(unComperessedData: any) {
    this.plain = unComperessedData;
    const MAX_GZIP_BLOCK_SIZE = 65536;
    let offset = 0;

    while (offset < MAX_GZIP_BLOCK_SIZE) {
      const bamRecord = new BamRecord();
      let blockSize,
        blockEnd,
        refID,
        pos,
        bmn,
        bin,
        mq,
        nl,
        flag_nc,
        flag,
        nc,
        lseq,
        nextRefID,
        nextPos,
        readName,
        j,
        p,
        lengthOnRef,
        cigar,
        c,
        cigarArray,
        seq,
        seqBytes;

      const CIGAR_DECODER = [
        "M",
        "I",
        "D",
        "N",
        "S",
        "H",
        "P",
        "=",
        "X",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?"
      ];
      const SECRET_DECODER = [
        "=",
        "A",
        "C",
        "x",
        "G",
        "x",
        "x",
        "x",
        "T",
        "x",
        "x",
        "x",
        "x",
        "x",
        "x",
        "N"
      ];

      if (offset >= this.plain.length) {
        return;
      }

      blockSize = this.readInt(this.plain, offset);
      if (blockSize > MAX_GZIP_BLOCK_SIZE) {
        this.state = new LoadState(
          State.Fail,
          "Loading the Bam records failed"
        );
        return;
      }
      blockEnd = offset + blockSize + 4;

      if (blockSize > MAX_GZIP_BLOCK_SIZE || blockEnd > MAX_GZIP_BLOCK_SIZE) {
        this.state = new LoadState(
          State.Fail,
          "Loading the Bam records failed"
        );
        return;
      }

      refID = this.readInt(this.plain, offset + 4);
      pos = this.readInt(this.plain, offset + 8);

      if (refID < 0) {
        this.state = new LoadState(
          State.Fail,
          "Loading the Bam records failed"
        );
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
      cigar = "";

      // nc Number of cigarOpp

      cigarArray = [];
      for (c = 0; c < nc; ++c) {
        const cigop = this.readInt(this.plain, p);
        // what is the uppermost byte?
        // var opLen = ((cigop & 0x00ffffff) >> 4);
        const opLen = cigop >> 4;
        const opLtr = CIGAR_DECODER[cigop & 0xf];
        if (
          opLtr === "M" ||
          opLtr === "EQ" ||
          opLtr === "X" ||
          opLtr === "D" ||
          opLtr === "N" ||
          opLtr === "="
        ) {
          lengthOnRef += opLen;
        }
        cigar = cigar + opLen + opLtr;
        p += 4;
        cigarArray.push({ len: opLen, ltr: opLtr });
      }
      bamRecord.cigar = cigar;

      seq = "";
      seqBytes = (lseq + 1) >> 1;
      for (j = 0; j < seqBytes; ++j) {
        // Getting the higher and lower four bits as each character is decoded with 4 bits
        const sb = this.plain[p + j];
        seq += SECRET_DECODER[(sb & 0xf0) >> 4];
        seq += SECRET_DECODER[sb & 0x0f];
      }

      // seq might have one extra character(if lseq is an odd number)
      seq = seq.substring(0, lseq);

      p += seqBytes;

      // Decoding the base Quality
      const self = this;
      let qual = "";

      if (lseq === 1 && String.fromCharCode(this.plain[p + j] + 33) === "*") {
        // to Do
      } else {
        for (j = 0; j < lseq; ++j) {
          qual += String.fromCharCode(this.plain[p + j] + 33);
        }
      }

      p += lseq;

      // Reading the type tags
      let typeTag = "";
      const tags = {};
      let value;

      while (p < this.plain.length) {
        const tag = String.fromCharCode(this.plain[p], this.plain[p + 1]);
        const type = String.fromCharCode(this.plain[p + 2]);

        if (type === "A") {
          value = String.fromCharCode(this.plain[p + 3]);
          p += 4;
        } else if (type === "i" || type === "I") {
          value = this.readInt(this.plain, p + 3);
          p += 7;
        } else if (type === "c" || type === "C") {
          value = this.plain[p + 3];
          p += 4;
        } else if (type === "s" || type === "S") {
          value = this.readShort(p + 3);
          p += 5;
        } else if (type === "f") {
          value = this.readFloat(p + 3);
          p += 7;
        } else if (type === "Z" || type === "H") {
          p += 3;
          value = "";
          for (;;) {
            const cc = this.plain[p++];
            if (cc === 0) {
              break;
            } else {
              value += String.fromCharCode(cc);
            }
          }
        } else {
          // Unknown type
          value = "Error unknown type" + type;
          break;
        }
        tags[tag] = type + " " + value;
      }

      p += blockEnd;
      offset = blockEnd;

      for (const x in tags) {
        if (tags.hasOwnProperty(x)) {
          typeTag += x + ":" + tags[x] + " ";
        }
      }
      // In Sam file all the cCsSiIf are considered to be integer
      typeTag = typeTag.replace(/[c|C|s|S|i|I|f]/g, "i");

      // assign the bam record fields
      bamRecord.flag = flag;
      bamRecord.pos = pos + 1;
      bamRecord.nextSegment = nextRefID;
      bamRecord.nextSegPos = nextPos + 1;
      bamRecord.readName = readName;
      bamRecord.seq = seq;
      bamRecord.qual = qual;
      bamRecord.chrName = this.chrName;
      bamRecord.mapQ = mq;
      bamRecord.typeTag = typeTag;

      this.bamRecordList.push(bamRecord);
      if (this.bamRecordList.length > 200) {
        return;
      }
    }
  }

  // Utility Functions
  readInt(ba, offset) {
    return (
      (ba[offset + 3] << 24) |
      (ba[offset + 2] << 16) |
      (ba[offset + 1] << 8) |
      ba[offset]
    );
  }

  readByte(offset) {
    return this.plain[offset];
  }

  readShort(offset) {
    return (this.plain[offset + 1] << 8) | this.plain[offset];
  }

  readFloat(offset) {
    const dataView = new DataView(this.plain.buffer),
      littleEndian = true;
    return dataView.getFloat32(offset, littleEndian);
  }
}
