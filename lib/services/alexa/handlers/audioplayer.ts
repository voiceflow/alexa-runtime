/* @ts-nocheck */

// import { utils } from '@voiceflow/common';
// import { HandlerInput, RequestHandler } from 'ask-sdk';

// import { Audio } from '../types';
// import { buildContext } from './lifecycle';

// const streamMetaData = (audio: Audio) => {
//   if (!play || _.isEmpty(play)) return {};

//   const { title, description, icon_img, background_img, url, offset } = audio;

//   const metaData = {
//     title: title || _.last(url.split('/')),
//     subtitle: description,
//   };
//   if (icon_img) {
//     metaData.art = {
//       sources: [
//         {
//           url: icon_img,
//         },
//       ],
//     };
//   }
//   if (background_img) {
//     metaData.backgroundImage = {
//       sources: [
//         {
//           url: background_img,
//         },
//       ],
//     };
//   }

//   // the parameters we care about for generating the hash
//   const token = utils.general.generateHash([url, title, description, icon_img, background_img]);
//   play.token = token;

//   return { metaData, token, url, offset };
// };

// const AudioPlayerHandler: RequestHandler = {
//   canHandle: (input: HandlerInput): boolean => input.requestEnvelope.request.type.startsWith('AudioPlayer.'),
//   async handle(input: HandlerInput) {
//     const context = await buildContext(input, null);

//     const event = input.requestEnvelope.request.type.split('.')[1];

//     let builder = input.responseBuilder;

//     switch (event) {
//       case 'PlaybackStarted':
//         if (session.finished && session.next_play) {
//           session.play = session.next_play;
//           session.line_id = session.next_line;
//           if (session.temp) {
//             session.diagrams = session.temp.diagrams;
//             session.globals = session.temp.globals;
//             session.randoms = session.temp.randoms;
//             delete session.temp;
//           }

//           delete session.next_play;
//           delete session.next_line;
//         }
//         context.storage.delete('finished');
//         break;
//       case 'PlaybackFinished':
//         context.storage.set('finished', true);
//         break;
//       case 'PlaybackStopped':
//         break;
//       case 'PlaybackNearlyFinished':
//         // Attempt to determine if there is another audio file after this && DO NOT SAVE THIS SESSION
//         if (session.play) {
//           if (session.play.loop) {
//             const { url, token, metaData } = streamMetaData(session.play);
//             builder = builder.addAudioPlayerPlayDirective('ENQUEUE', url, token, 0, token, metaData);
//           } else if (session.play.action === 'START' && !session.next_play) {
//             let temp_session = cloneDeep(session);

//             // explore ahead to see if there is another stream block
//             temp_session.play.action = 'NEXT';
//             temp_session.handlerInput = handlerInput;
//             temp_session = await updateState(temp_session, skill_id);
//             delete temp_session.handlerInput;
//             if (temp_session.play && temp_session.play.action === 'START') {
//               const { url, token, metaData } = streamMetaData(temp_session.play);
//               builder = builder.addAudioPlayerPlayDirective('ENQUEUE', url, token, 0, session.play.token, metaData);
//               session.next_play = temp_session.play;
//               session.next_line = temp_session.line_id;
//               session.temp = {
//                 diagrams: temp_session.diagrams,
//                 globals: temp_session.globals,
//                 randoms: temp_session.randoms,
//               };
//             }
//           } else if (session.play.action === 'RESUME' && session.next_play) {
//             const { url, token, metaData } = streamMetaData(session.next_play);
//             builder = builder.addAudioPlayerPlayDirective('ENQUEUE', url, token, 0, session.play.token, metaData);
//           }
//         }
//         break;
//       case 'PlaybackFailed':
//         break;
//       default:
//         throw new Error('Should never reach here!');
//     }

//     return builder.getResponse();
//   },
// };

// export default AudioPlayerHandler;
