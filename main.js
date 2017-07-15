// Create our 'main' state that will contain the game

iterations = 0;
highscore = 0;

Neuvol = new Neuroevolution({
    population:2000,
    elitism: 0.02,
    randomBehaviour: 0.98,
    mutationRate:0.99,
    mutationRange:2,
    nbChild: 10,
    network:[2, [2], 1]
});

var mainState = {
    preload: function() { 
        // This function will be executed at the beginning     
        // That's where we load the images and sounds 
        game.load.image('bird', './assets/bird.png'); 
        game.load.image('pipe', 'assets/pipe.png');

    },

    create: function() {


        iterations++;

        if(iterations == 1) {
            this.gen = Neuvol.nextGeneration();    
        }
        
        this.birds = game.add.group();

        this.score = 0;

        this.labelScore = game.add.text(20, 25, "Score: 0", 
            { font: "30px Arial", fill: "#ffffff" });   

        this.numberOfBirdsLabel = game.add.text(20, 70, 'Number of birds: ' + this.gen.length, 
            { font: "24px Arial", fill: "#ffffff" });

        this.iterationsText = game.add.text(20, 100, "Generations:" + iterations, 
            { font: "24px Arial", fill: "#ffffff" });  

        this.iterationsText = game.add.text(20, 130, "Highscore: " + highscore, 
            { font: "24px Arial", fill: "#ffffff" }); 

        // This function is called after the preload function     
        // Here we set up the game, display sprites, etc.  
        game.stage.backgroundColor = '#71c5cf';

        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.floor = this.game.add.sprite(0, 490);
        this.physics.enable(this.floor, Phaser.Physics.ARCADE);
        this.floor.body.immovable = true;
        this.floor.body.width = this.game.world.width;

        // Display the bird at the position x=100 and y=245
        for (var i = 0; i < this.gen.length; i++) {
            var bird = game.add.sprite(100, 245, 'bird');    
            game.physics.arcade.enable(bird);
            bird.body.gravity.y = 1000;
            this.birds.add(bird);
        }

        this.pipes = game.add.group();
        this.obstacles = [];
        this.numberOfJumps = 0;

        this.timeBaseLine = 1500;
        this.randomFrequency(this.timeBaseLine);

    },

    update: function() {
        // This function is called 60 times per second    
        // It contains the game's logic 

        for (var k = 0; k < this.birds.length; k++) {
            this.game.physics.arcade.collide(this.floor, this.birds.children[k]);
        }

        this.score++;
        this.labelScore.text = "Score: " + this.score; 

        var nextObstacle = this.obstacles[this.obstacles.length - 1];

        if (nextObstacle) {

            var inputs = [nextObstacle.pipe.x / 800, nextObstacle.width / 150];

            for (var i = 0; i < this.birds.length; i++) {
                var currBird = this.birds.children[i];

                if (currBird.y == 440) {
                //inputs.push(currBird.y / 490);
                    var res = this.gen[i].compute(inputs);

                    if(res[0] > 0.5){
                        //console.log("Bird "+ i +" wants to jump");
                        currBird.body.velocity.y = -575;
                     }
                }

                game.physics.arcade.overlap(this.birds.children[i], this.pipes, function(bird){
                    bird.kill();
                    this.birds.remove(bird);
                    this.numberOfBirdsLabel.text = "Number of birds: " + this.birds.length;


                    if (this.score > highscore) {
                        highscore = this.score;
                    }
                  
                    Neuvol.networkScore(this.gen[i], this.score);

                    if (this.birds.length < 2) {
                        console.log(this.gen[i]);
                    }
                }, null, this);

                if (this.birds.length < 1) {
                    Neuvol.nextGeneration();
                    this.restartGame();
                }
            }

        }

    },

    // Restart the game
    restartGame: function() {
        // Start the 'main' state, which restarts the game
        
        game.time.reset();
        game.state.start('main');

        
    },

    addObstacle: function(x, y, firstPipe) {
        // Create a pipe at the position x and y
        var pipe = game.add.sprite(x, y, 'pipe');

        // Add the pipe to our previously created group
        this.pipes.add(pipe);

        // Enable physics on the pipe 
        game.physics.arcade.enable(pipe);

        // Add velocity to the pipe to make it move left
        //pipe.body.velocity.x = -600 - (this.timeSinceGameStart() * 0.001); 
        pipe.body.velocity.x = -600; 

        pipe.checkWorldBounds = true;

        pipe.events.onOutOfBounds.add(function(pipe) {
            if (pipe.x < 0) {
                if (firstPipe) {
                    this.obstacles.shift();
                }
                pipe.destroy();
            }
        }, this);

        return pipe;

    },

    addRowOfPipes: function() {
        // Randomly pick a number between 1 and 5
        // This will be the hole position

        var height = Math.floor(Math.random() * 2) + 1;
        var width = Math.floor(Math.random() * 3) + 1;
        var firstPipe;

        // Add the 6 pipes 
        // With one big hole at position 'hole' and 'hole + 1'
        firstPipe = this.addObstacle(800, 440, false);

        this.obstacles.push({
            width: width*50,
            pipe: firstPipe 
        });

    },

    randomFrequency: function(time) {
        var negPosRand = (Math.random() - 0.5) * 2;
        var distanceMultiplier = 200;
        if (negPosRand > 0) {
            distanceMultiplier = 500
        }

        var self = this;
        game.time.events.add(time, function(){
            self.addRowOfPipes();
            //self.randomFrequency(self.timeBaseLine + (negPosRand*distanceMultiplier));
            self.randomFrequency(self.timeBaseLine);
        }, this);
    },

    timeSinceGameStart: function() {
        return game.time.time - game.time._started;
    }
};

// Initialize Phaser, and create a 400px by 490px game
var game = new Phaser.Game(800, 490);

// Add the 'mainState' and call it 'main'
game.state.add('main', mainState); 

// Start the state to actually start the game
game.state.start('main');
