import * as tf from '@tensorflow/tfjs';
import * as _ from 'lodash';
import { Blast } from './index.js';

Blast.build(false);

function setup() {
  // Set runner as a global variable if you need runtime debugging.
  window.Blast = Blast;  
  document.addEventListener('gamestart',function(){
    handleReset();
  }); 
  document.addEventListener('playing',handleRunning);
  document.addEventListener('died',handleCrash);
}
// variable which tells whether the game is being loaded for the first time i.e. not a reset

let firstTime = true; 


function handleReset() {
 // if the game is being started for the first time initiate 
  // the model and compile it to make it ready for training and predicting
  if (firstTime) {
    firstTime = false;
    // creating a tensorflow sequential model
    Blast.model = tf.sequential();
    // Blast.model.init();
    // adding the first hidden layer to the model using with 3 inputs ,
    // sigmoid activation function
    // and output of 6
    Blast.model.add(tf.layers.dense({
      inputShape:[2],
      activation:'sigmoid',
      units:4
    }))

    /* this is the second output layer with 6 inputs coming from the previous hidden layer
    activation is again sigmoid and output is given as 2 units 10 for not jump and 01 for jump
    */
    Blast.model.add(tf.layers.dense({
      inputShape:[4],
      activation:'sigmoid',
      units:2
    }))

    /* compiling the model using meanSquaredError loss function and adam 
    optimizer with a learning rate of 0.1 */
    Blast.model.compile({
      loss:'meanSquaredError',
      optimizer : tf.train.adam(0.1)
    })

    // object which will containn training data and appropriate labels
    Blast.training = {
      inputs: [],
      labels: []
    };
    console.info('Model initiated');
  } else {
    // Train the model before restarting.
    // log into console that model will now be trained
    console.info('Training');
    // convert the inputs and labels to tensor2d format and  then training the model
    //console.info(tf.tensor2d(Blast.training.inputs))
    Blast.model.fit(tf.tensor2d(Blast.training.inputs), tf.tensor2d(Blast.training.labels));
    console.log(Blast.model.summary());
  }
}

/**
 * documentation
 * @param {object} Blast
 * @param {object} state
 * returns a promise resolved with an action
 */

function handleRunning(state ) {
  return new Promise((resolve) => {
    var state = Blast.getState();    
      // whenever the Blast is not jumping decide whether it needs to jump or not
      //let action = 0;// variable for action 1 for jump 0 for not
      // call model.predict on the state vector after converting it to tensor2d object
      const prediction = Blast.model.predict(tf.tensor2d([convertStateToVector(state)]));
      // the predict function returns a tensor we get the data in a promise as result
      // and based don result decide the action
      const predictionPromise = prediction.data();
      
      predictionPromise.then((result) => {
        // console.log(result);
        // converting prediction to action
        var best = _.max(result);
        if (best === result[0]) {
         // console.info('right');
          Blast.goRight();
        } else if (best === result[1]){
          //console.info('left');
          Blast.goLeft();
        }
        Blast.lastState = state;            
        resolve();
      });
  });
}
/**
 * 
 * @param {object} Blast 
 * handles the crash of a Blast before restarting the game
 * 
 */
function handleCrash() {
  let input = null;
  let label = null;
  var state = Blast.getState();
  console.log(state);
  input = convertStateToVector(Blast.lastState);  
  if (state.score > state.highScore){
    label = [0, 1];
  } else{
    label = [1, 0];
  }
  console.log(label);
  // check if at the time of crash Blast was jumping or not
  // if (state.score > state.highScore && state.isJumping) {
  //   // convert state object to array
  //   input = convertStateToVector(Blast.lastJumpingState);
  //   label = [1, 0, 0];
  // } else if (state.score > state.highScore && state.velocity >= .5){
  //   // convert state object to array
  //   input = convertStateToVector(Blast.lastRunningState);
  //   label = [0, 1, 0];
  // } else if (state.score > state.highScore && state.velocity < .5){
  //   // convert state object to array
  //   input = convertStateToVector(Blast.lastRunningState);
  //   label = [0, 0, 1];
  // } else {
  //   input = convertStateToVector(Blast.lastRunningState);
  //   label = [0, 0, 0];
  // }
  // // push the new input to the training set
  Blast.training.inputs.push(input);
  // push the label to labels
  Blast.training.labels.push(label);
}

/**
 * 
 * @param {object} state
 * returns an array 
 * converts state to a feature scaled array
 */
function convertStateToVector(state) {
  if (state) {
    var s = [
      //state.isJumping,      
      //state.velocity,
      //state.left,
      //state.right,
      state.starLeft,
      state.starRight,
  //    state.score
    ];
    //console.log(s);
    return s;
  }
  return [10, 10];
}
// call setup on loading content
document.addEventListener('DOMContentLoaded', setup);
