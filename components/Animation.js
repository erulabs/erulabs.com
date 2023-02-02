import dynamic from "next/dynamic";
import ColorScheme from "color-scheme";

const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default), {
	ssr: false,
});

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16),
				parseInt(result[2], 16),
				parseInt(result[3], 16),
		  ]
		: null;
}

// organic is used to store the list of instances of Organic objects that we will create
var organics = [];
// The variable change stores the rate of rotation and the y coordinate for noise later
var change, colorsPalette;

function windowResized(p5) {
	p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
	for (let i = 0; i < organics.length; i++) {
		organics[i].xpos = p5.windowWidth / 2;
	}
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function setup(p5, canvasParentRef) {
	p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);

	const colorScheme = new ColorScheme();
	const colors = colorScheme
		.scheme("triade")
		.variation("light")
		.distance(0.75)
		.colors();

	colorsPalette = colors.map((c) => {
		return p5.color(...hexToRgb(c), getRandomArbitrary(10, 40));
	});

	change = 0;

	for (var i = 0; i < 110; i++) {
		organics.push(
			new Organic({
				p5,
				radius: getRandomArbitrary(0, 5) + 0.1 + 1 * i,
				xpos: p5.windowWidth / 2,
				ypos: 250,
				roughness: i * 10,
				angle: i * p5.random(90),
				color: colorsPalette[p5.floor(p5.random(8))],
			})
		);
	}

	// organic[0].show();
	// noLoop();
}

function draw(p5) {
	p5.background(255, 255, 255);
	for (var i = 0; i < organics.length; i++) {
		organics[i].show(change);
	}
	change += 0.0015;
}

function Organic({ p5, radius, xpos, ypos, roughness, angle, color }) {
	this.radius = radius; //radius of blob
	this.xpos = xpos; //x position of blob
	this.ypos = ypos; // y position of blob
	this.roughness = roughness; // magnitude of how much the circle is distorted
	this.angle = angle; //how much to rotate the circle by
	this.color = color; // color of the blob

	this.useStroke = false;
	if (Math.random() > 0.5) {
		this.useStroke = true;
	}

	this.show = function (change) {
		if (this.useStroke) {
			p5.strokeWeight(0.4); //We can use this to set thickness of the stroke if necessary
			p5.stroke(0, 0, 0, 55); //We can use this to set the color of the stroke if necessary
		} else {
			p5.noStroke(); // no stroke for the circle
		}

		p5.fill(this.color); //color to fill the blob

		p5.push(); //we enclose things between push and pop so that all transformations within only affect items within
		p5.translate(this.xpos, this.ypos); //move to xpos, ypos
		p5.rotate(this.angle + change); //rotate by this.angle+change
		p5.beginShape(); //begin a shape based on the vertex points below
		//The lines below create our vertex points
		var off = 0;
		for (var i = 0; i < p5.TWO_PI; i += 0.1) {
			var offset = p5.map(
				p5.noise(off, change),
				0,
				1,
				-this.roughness,
				this.roughness
			);
			var r = this.radius + offset;
			var x = r * p5.cos(i);
			var y = r * p5.sin(i);
			p5.vertex(x, y);
			off += 0.1;
		}
		p5.endShape(); //end and create the shape
		p5.pop();
	};
}

const Animation = () => {
	return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};

export default Animation;
