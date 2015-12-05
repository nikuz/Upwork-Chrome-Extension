'use strict';

import * as React from 'react';

import './style';

class Skills extends React.Component {
  static propTypes = {
    items: React.PropTypes.array.isRequired
  };
  render() {
    var items = this.props.items;
    if (items && items.length) {
      return (
        <div className="jli_skills">
          {items.map((skill, key) => {
            return <span key={key} className="jl_skill">{skill}</span>;
          })}
        </div>
      );
    } else {
      return null;
    }
  }
}

export default Skills;