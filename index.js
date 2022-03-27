
const MAXLEN = 256;
const MAXFRET = 24;
const MAXSTR = 5;
const MAXPATH = 512;

function rect(x, y, width, height)
{
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
}


const dp = "dp";
const px = "px";

const cw = 600;
const ch = 800;
const em = 16;
const ex = 8;


function note()
{
	zero(this);
}

function zero(note)
{
	note.string = 0;
	note.fret = new Array();
	note.duration = 0;
	note.stem = 0;
	note.beam = 0;
	note.hon = 0;
	note.flags = 0;
	note.x = 0;
	note.y = 0;
}

var time = [ 4, 4 ];

var length = 0;

function initune()
{
	let i;

	tune = new Array(MAXLEN);

	for (i = 0; i < MAXLEN; i++) {
		tune[i] = new note();
		zero(tune[i]);
	}

	length = 0;
}

function move(base, dest, src, n)
{
	let i;
	let copy = new Array(n);
	for (i = 0; i < n; i++) {
		copy[i] = base[src + i];
	}
	for (i = 0; i < n; i++) {
		base[dest + i] = copy[i];
	}
}

var caret = { pos: 0, depth: 0, duration: 0 };

function depth(j)
{
	return (j + 1) * em + em / 3;
}

function width(i)
{
	return 160 / tune[i].duration;
}

function delta(i)
{
	return 16 / tune[i].duration;
}

function mtov(index, r)
{
	let x = tune[index].x;
	let y = tune[index].y;
	
	/* Center rectangle around midpoint of position. */
	r.x = x - em / 2;
	r.y = depth(caret.depth) + y - em + 2;
	r.width = em;
	r.height = em;
}

function staffline(cx)
{
	cx.translate(0, 16);
	cx.beginPath();
	cx.moveTo(0, 0);
	cx.lineTo(510, 0);
	cx.stroke();
}

function staff(cx, x, y)
{
	cx.save();
	cx.translate(0, y);
	cx.strokeStyle = "lightgray";
	for (i = 0; i < 5; i++) {
		staffline(cx);
	}
	cx.restore();
}

function bar(cx, x, y)
{
	cx.beginPath();
	cx.moveTo(x, y + em);
	cx.lineTo(x, y + 5 * em);
	cx.stroke();
}

function drawnote(cx, i, x, y)
{
	let  j;
	let  maxj = 0;

	cx.save();
	cx.translate(0, y);
	for (j = 0; j < MAXSTR; j++) {
		if (tune[i].string & (1 << j)) {
			let s = tune[i].fret[j].toString();
			cx.fillText(s, x - s.length * ex / 2, depth(j));
			maxj = j > maxj ? j : maxj;
		}
	}
	if (tune[i].stem) {
		cx.beginPath();
		cx.moveTo(x, 6 * em);
		cx.lineTo(x, depth(maxj) + 2);
		cx.stroke();
	}
	if (tune[i].beam) {
		cx.save();
		cx.lineWidth = 2;
		cx.beginPath();
		cx.moveTo(x, 6 * em);
		cx.lineTo(x + width(i), 6 * em);
		cx.stroke();
		cx.restore();
	}
	if (tune[i].flags) {
		cx.beginPath();
		cx.moveTo(x, 6 * em);
		cx.lineTo(x + ex, 5 * em);
		cx.stroke();
	}
	if (tune[i].hon) {
		cx.fillText("H", x + width(i)/2, depth(0) - 5);
	}
	cx.restore();

}

function paintcaret(cx)
{
	let r = new rect(0, 0, 0, 0);

	mtov(caret.pos, r);

	cx.save();
	cx.strokeStyle = "red";
	cx.strokeRect(r.x, r.y, r.width, r.height);
	cx.restore();
}

function setup()
{
	let dp = window.devicePixelRatio;
	let cv = document.getElementById('cv');
	cv.width = cw * dp;
	cv.height = ch * dp;
	cv.style.width = cw + px;
	cv.style.height = ch + px;
	cx = cv.getContext('2d');
	cx.fillStyle = 'black';
	cx.font = em + 'px sans';
	cx.scale(dp, dp);
	cx.translate(30, 20);
}

function paint(cx)
{
	let i, x = 0, dx, y = 0, t, dt;

	let m = 16;
	let w = 512;

	cx.save();
	cx.clearRect(0, 0, cw, ch);

	staff(cx, x, y);

	for (i = 0, x = 10, t = 0; i < length; i++) {
		dt = delta(i);
		dx = width(i);
		if (t + dt > m) {
			bar(cx, x, y);
			x += 10;
			t = 0;
		}
		if (x + dx > w) {
			x = 0;
			y += 100;
			staff(cx, x, y);
			bar(cx, x, y);
			x += 10;
		}
		drawnote(cx, i, x, y);
		tune[i].x = x;
		tune[i].y = y;
		t += dt;
		x += dx;
	}

	bar(cx, x, y);

	tune[i].x = x;
	tune[i].y = y;

	paintcaret(cx);
	cx.restore();
}

function calcbeams()
{
	let i, t = 0, d1, d2, b;
	
	for (i = 0; i < length; i++) {
		tune[i].flags = (tune[i].duration == 8);
	}

	for (i = 0; i < length - 1; i++) {
		d1 = tune[i].duration;
		d2 = tune[i+1].duration;
		b = ((d1 == d2) && (d1 == 8) && (t % 4 == 0));
		tune[i].beam = b;
		t += delta(i);
		if (b) {
			tune[i].flags = 0;
			tune[i+1].flags = 0;
		}
	}
}

function repaint()
{
	calcbeams();
	paint(cx);
}

function setdur(dur)
{
	caret.duration = dur;

	if (caret.pos < length) {
		tune[caret.pos].duration = dur;
		repaint();
	}
}

function setpos(newpos, newdepth)
{
	let r = new rect(0, 0, 0, 0);

	if (newpos < 0 || newpos > length || newdepth < 0 || newdepth > 4)
		return;

	cx.save();

	mtov(caret.pos, r);
	cx.rect(r.x - 1, r.y - 1, r.width + 2, r.height + 2);

	caret.depth = newdepth;

	mtov(newpos, r);
	cx.rect(r.x - 1, r.y - 1, r.width + 2, r.height + 2);

	cx.clip();

	caret.pos = newpos;
	paint(cx);

	cx.restore();
}


function clear()
{
	let i, j;

	if ((i = caret.pos) < length) {
		j = caret.depth;
		tune[i].string &= ~(1 << j);
		tune[i].stem = (tune[i].string != 0);
		repaint();
	}
}


function input(c)
{
	let i, n, f, g;

	i = caret.pos;
	n = c.charCodeAt(0) - '0'.charCodeAt(0);
	g = caret.depth;
	f = (tune[i].fret[g] || 0) * 10;

	if (f + n > MAXFRET)
		f = n;
	else
		f += n;

	tune[i].string |= 1 << g;
	tune[i].fret[g] = f;

	if (i == length) {
		tune[i].duration = caret.duration;
		++length;
	}

	tune[i].stem = (tune[i].duration > 2);

	repaint();
}

function doctrlinput(s)
{
	switch (s.charAt(0)) {
	case '4':
		setdur(4);
		break;
	case '8':
		setdur(8);
		break;
	}
}

function del()
{
	let i = caret.pos;
	let n = (--length) - i;

	move(tune, i, i + 1, n);

	repaint();
}

function insert()
{
	if (length < MAXLEN) {
		let i = caret.pos;
		let n = (length++) - i;
		tune.splice(i, 0, new note());
		zero(tune[i]);
		tune[i].duration = caret.duration;
		repaint();
	}
}

function onkeyup(cmd)
{
	switch (cmd.charAt(0)) {
	case 'l':
		setpos(caret.pos + 1, caret.depth);
		break;
	case 'h':
		setpos(caret.pos - 1, caret.depth);
		break;
	case 'j':
		setpos(caret.pos, caret.depth + 1);
		break;
	case 'k':
		setpos(caret.pos, caret.depth - 1);
		break;
	case 'x':
		clear();
		break;
	case 'C':
		if (cmd.startsWith("Ctrl")) {
			doctrlinput(cmd.substring(4));
		}
		break;
	case 'D':
		del();
		break;
	case 'I':
		insert();
		break;
	default:
		let c = cmd.charCodeAt(0);
		if ('0'.charCodeAt(0) <= c && c <= '9'.charCodeAt(0)) {
			input(cmd);
		}
		break;
	}
}

function file_export()
{
  let a = document.createElement('a');
  let data = JSON.stringify(tune);
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
  a.setAttribute('download', "tune.json");
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function main()
{
	initune();

	cv = document.getElementById('cv')
	cx = cv.getContext("2d")
	cx.fillStyle = 'black'

	setup();
	paint(cx);

	caret.pos = 0;
	caret.depth = 0;
	caret.duration = 4;
}


document.body.addEventListener("keyup", (event) => {
  let cmd = (event.ctrlKey ? "Ctrl" : "") + event.key;
  console.log(cmd);
  onkeyup(cmd);
});

document.body.addEventListener("click", (event) => {
  if (event.target.id === "export") {
    file_export();
  }
});

main();

