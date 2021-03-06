import React from 'react'
import { Row, Col, Button, Alert, Glyph, Spinner } from 'elemental'
import ContentModule from '../shared_components/ContentModule'

export default React.createClass({
  renderGrades: function () {
    var block = [];
    var grades = this.props.grades;
    var deliverables = this.props.deliverables;

    for (var index = 0; index < deliverables.length; index++) {
      block[index] = (
        <tr key={index}>
          <td className="tg-edam">{deliverables[index].name}</td>
          <td className="tg-yw4l">{grades[index]}</td>
          <td className="tg-yw4l">-</td>
        </tr>);
    }

    // console.log("Grades.js| Rendering grades");    
    return (<tbody>{block}</tbody>)
  },
  render: function () {
    return (
      <ContentModule id="gradesModule" title="Grades" initialHideContent={false}>

        <div className="tg-wrap">
          <table className="tg">
            <tbody>
              <tr>
                <th className="tg-yw4l">Assignment</th>
                <th className="tg-yw4l">Grade</th>
                <th className="tg-yw4l">Class Average</th>
              </tr>
            </tbody>
            {!!this.props.grades && !!this.props.deliverables && this.renderGrades() }
          </table>
        </div>

      </ContentModule>
    )
  }
})