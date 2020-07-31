import sequencer from 'heartbeat-sequencer';

type EventData = {
  command: number,
  data1: number,
  data2: number,
  ticks: number,
  voice?: number,
  staff?: number,
}

type EventDataPerPart = {
  [partId: string]: EventData[],
};

type PartData = {
  id: string,
  name: string,
}[];

type ParsedData = {
  bpm: number,
  parts: PartData,
  eventDataPerPart: EventDataPerPart,
}

const NOTE_ON = 0x90; // 144
const NOTE_OFF = 0x80; // 128
const TIME_SIGNATURE = 0x58; // 88

const parse = (xmlDoc: XMLDocument, ppq: number): ParsedData | null => {
  if (xmlDoc === null) {
    return null;
  }
  let type;
  if (xmlDoc.firstChild !== null && xmlDoc.firstChild.nextSibling !== null) {
    type = xmlDoc.firstChild.nextSibling.nodeName;
  }
  // console.log('type', type, nsResolver);

  if (type === 'score-partwise') {
    return parsePartWise(xmlDoc, ppq);
  }
  if (type === 'score-timewise') {
    return parseTimeWise(xmlDoc);
  }
  // console.log('unknown type', type);
  return null;
}

const parsePartWise = (xmlDoc: XMLDocument, ppq: number): [PartData, EventDataPerPart] => {
  const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument === null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
  const partIterator = xmlDoc.evaluate('//score-part', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
  const events: EventDataPerPart = {};
  const parts: PartData = [];
  const tiedNotes: { [id: string]: number } = {};

  let tmp;
  let tmp1;
  let partNode;
  while (partNode = partIterator.iterateNext()) {
    // get id and name of the part
    const partId = xmlDoc.evaluate('@id', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    const partName = xmlDoc.evaluate('part-name', partNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
    parts.push({ id: partId, name: partName });
    events[partId] = [];

    let velocity = 100;
    tmp = xmlDoc.evaluate('midi-instrument/volume', partNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
    if (!isNaN(tmp)) {
      velocity = (tmp / 100) * 127;
    }

    const measureIterator = xmlDoc.evaluate('//part[@id="' + partId + '"]/measure', partNode, nsResolver, XPathResult.ANY_TYPE, null);
    let measureNode;
    let ticks = 0;
    let divisions = 1;
    let numerator = 4;
    let denominator = 4;
    while (measureNode = measureIterator.iterateNext()) {
      const measureNumber = xmlDoc.evaluate('@number', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      tmp = xmlDoc.evaluate('attributes/divisions', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        divisions = tmp;
        // console.log('divisions', divisions);
      }
      tmp = xmlDoc.evaluate('attributes/time/beats', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      tmp1 = xmlDoc.evaluate('attributes/time/beat-type', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp) && !isNaN(tmp1)) {
        numerator = tmp;
        denominator = tmp1;
        events[partId].push({ command: TIME_SIGNATURE, data1: numerator, data2: denominator, ticks });
      }

      let bpm = 120;
      tmp = xmlDoc.evaluate('direction/sound/@tempo', measureNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
      if (!isNaN(tmp)) {
        bpm = tmp;
      }

      tmp = xmlDoc.evaluate('barline/repeat/@direction', measureNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
      if (tmp !== '') {
        console.log(tmp, measureNumber);
      }

      // get all notes and backups
      const noteIterator = xmlDoc.evaluate('*[self::note or self::backup or self::forward]', measureNode, nsResolver, XPathResult.ANY_TYPE, null);
      let noteNode;
      while (noteNode = noteIterator.iterateNext()) {
        // console.log(noteNode);
        let noteDuration = 0;
        let noteDurationTicks = 0;
        let voice = -1;
        let staff = -1;

        let tieStart = false;
        let tieStop = false;
        const tieIterator = xmlDoc.evaluate('tie', noteNode, nsResolver, XPathResult.ANY_TYPE, null);
        let tieNode;
        while (tieNode = tieIterator.iterateNext()) {
          const tieType = xmlDoc.evaluate('@type', tieNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          if (tieType === 'start') {
            tieStart = true;
          } else if (tieType === 'stop') {
            tieStop = true;
          }
        }

        const rest = xmlDoc.evaluate('rest', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const chord = xmlDoc.evaluate('chord', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const grace = xmlDoc.evaluate('grace', noteNode, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        if (rest !== null) {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          // console.log('rest', ticks);
        } else if (noteNode.nodeName === 'note' && grace === null) {
          const step = xmlDoc.evaluate('pitch/step', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          const alter = xmlDoc.evaluate('pitch/alter', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          const octave = xmlDoc.evaluate('pitch/octave', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          tmp = xmlDoc.evaluate('voice', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          if (!isNaN(tmp)) {
            voice = tmp;
          }
          tmp = xmlDoc.evaluate('staff', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          if (!isNaN(tmp)) {
            staff = tmp;
          }
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          noteDurationTicks = (noteDuration / divisions) * ppq;
          // const noteType = xmlDoc.evaluate('type', noteNode, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
          let noteName = step;

          if (!isNaN(alter)) {
            switch (alter) {
              case -2:
                noteName += 'bb';
                break;
              case -1:
                noteName += 'b';
                break;
              case 1:
                noteName += '#';
                break;
              case 2:
                noteName += '##';
                break;
            }
          }

          const noteNumber = sequencer.getNoteNumber(noteName, octave);
          const note = {
            command: NOTE_ON,
            ticks,
            data1: noteNumber,
            data2: velocity,
            voice,
            staff,
          };
          ticks += noteDurationTicks;
          if (chord !== null) {
            ticks -= noteDurationTicks;
          }

          events[partId].push(note);
          //console.log('tie', tieStart, tieStop);

          if (tieStart === false && tieStop === false) {
            // no ties
            //console.log('no ties', measureNumber, voice, noteNumber, tiedNotes);
            events[partId].push({
              command: NOTE_OFF,
              ticks,
              data1: noteNumber,
              data2: 0,
              voice,
              staff,
            });
          } else if (tieStart === true && tieStop === false) {
            // start of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] = noteDurationTicks;
            //console.log('start', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === true && tieStop === true) {
            // tied to yet another note
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] += noteDurationTicks;
            //console.log('thru', measureNumber, voice, noteNumber, tiedNotes);
          } else if (tieStart === false && tieStop === true) {
            // end of tie
            tiedNotes[`N_${staff}-${voice}-${noteNumber}`] += noteDurationTicks;
            events[partId].push({
              command: NOTE_OFF,
              ticks: tiedNotes[`N_${staff}-${voice}-${noteNumber}`],
              data1: noteNumber,
              data2: 0,
              voice,
              staff,
            });
            delete tiedNotes[`N_${staff}-${voice}-${noteNumber}`];
            //console.log('end', measureNumber, voice, noteNumber, tiedNotes);
          }

        } else if (noteNode.nodeName === 'backup') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks -= (noteDuration / divisions) * ppq;
          // console.log('backup', ticks);
          //console.log(noteDuration, divisions);
        } else if (noteNode.nodeName === 'forward') {
          noteDuration = xmlDoc.evaluate('duration', noteNode, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
          ticks += (noteDuration / divisions) * ppq;
          // console.log('forward', ticks);
          //console.log(noteDuration, divisions);
        }
      }
    }
  }
  return [parts, events];
}

const parseTimeWise = (doc: XMLDocument): [PartData, EventDataPerPart] | null => {
  return null;
}

export {
  parse,
}