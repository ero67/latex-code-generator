import { Tree } from 'react-tree-graph';
import { AnimatedTree } from 'react-tree-graph';
import 'react-tree-graph/dist/style.css'

const data = {
	name: 'Parent',
	children: [{
		name: 'Child One'
	}, {
		name: 'Child Two'
	}]
};

<Tree
	data={data}
	height={400}
	width={400}/>;



<AnimatedTree
	data={data}
	height={400}
	width={400}/>;