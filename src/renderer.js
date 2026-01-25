/**
 * ShakuhachiRenderer - A vanilla JavaScript SVG generator for shakuhachi music scores
 */
export class ShakuhachiRenderer {
  constructor(container) {
    this.container = container;
    this.width = 800;
    this.height = 600;
    this.svg = null;
  }

  /**
   * Initialize the SVG element
   */
  initSVG() {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', this.width);
    this.svg.setAttribute('height', this.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.container.appendChild(this.svg);
  }

  /**
   * Render a shakuhachi score
   * @param {Object} score - The score data containing notes
   */
  render(score) {
    // Clear existing content
    this.container.innerHTML = '';

    // Initialize SVG
    this.initSVG();

    // Render notes
    if (score.notes && score.notes.length > 0) {
      this.renderNotes(score.notes);
    }
  }

  /**
   * Render individual notes
   * @param {Array} notes - Array of note objects
   */
  renderNotes(notes) {
    const startX = 50;
    const startY = 100;
    const noteSpacing = 100;

    notes.forEach((note, index) => {
      const x = startX + index * noteSpacing;
      const y = startY;

      // Create a group for the note
      const noteGroup = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );
      noteGroup.setAttribute('class', 'note');

      // Render note symbol (placeholder - you'll customize this)
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 20);
      circle.setAttribute('fill', '#333');
      circle.setAttribute('stroke', '#000');
      circle.setAttribute('stroke-width', 2);

      // Add note name as text
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text'
      );
      text.setAttribute('x', x);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', '14');
      text.textContent = note.name;

      noteGroup.appendChild(circle);
      noteGroup.appendChild(text);
      this.svg.appendChild(noteGroup);
    });
  }
}
