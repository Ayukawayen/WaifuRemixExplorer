let log = {
	mains:[],
	models:[],
};

let tokenId;

let provider;
let contractMixed;
let contractOriginal;

window.ethereum.request({
	method: 'eth_requestAccounts',
}).then((response)=>{
	window.ethereum.request({
		method: 'wallet_switchEthereumChain',
		params: [{ chainId: '0x2710' }],
	}).then((response)=>{
		provider = new ethers.providers.Web3Provider(window.ethereum);
		contractMixed = new ethers.Contract(ContractAddrMixed, ContractABIMixed, provider);
		contractOriginal = new ethers.Contract(ContractAddrOriginal, [
			'function tokenURI(uint256 tokenId) view returns (string)',
		], provider);
		
		refresh();
	}).catch((err)=>{
		alert(err.message);
	});
});

window.addEventListener('hashchange', refresh);


document.querySelector('input#tokenId').addEventListener('change', ()=>{
	tokenId = document.querySelector('input#tokenId').value;
	tokenId = parseInt(tokenId);
	if(!tokenId) {
		alert('Invalid tokenId');
		return;
	}
	
	location.hash = '#' + tokenId;
});


async function refresh() {
	tokenId = parseInt(location.hash.substr(1)) || 0;
	
	if(!tokenId) return;
	
	document.querySelector('input#tokenId').value = tokenId;

	document.querySelector('#original img').src = '';
	document.querySelector('#original h4').textContent = '';
	
	loadMetadata(contractOriginal, tokenId).then((response)=>{
		let node = document.querySelector(`#original`);
		node.querySelector('img').src = response.image;
		node.querySelector('h4').textContent = response.name;
	});
	
	loadTokens(null, tokenId).then((response)=>{
		updateTokens(response, document.querySelector(`#mixed_models`), 'origin');
	});
	loadTokens(tokenId, null).then((response)=>{
		updateTokens(response, document.querySelector(`#mixed_mains`), 'model');
	});
}

async function loadTokens(main, model) {
	let response = await contractMixed.queryFilter( contractMixed.filters.Mint(null, main, model) );
	
	return response;
}

async function updateTokens(items, listNode, spouse) {
	let nodes = listNode.querySelectorAll('.item');
	for(let i=0; i<nodes.length; ++i) {
		nodes[i].querySelector('img').src = '';
	}
	for(let i=nodes.length-1; i>=items.length; --i) {
		listNode.removeChild(nodes[i].parentNode);
	}
	for(let i=nodes.length; i<items.length; ++i) {
		let node = createElement('li', {}, [
			createElement('a', {'class':'item', index:i}, [
				createElement('img', {}, ''),
				createElement('h4', {}, [
					'× ',
					createElement('span', {}, ''),
				]),
			]),
		]);
		
		listNode.appendChild(node);
	}

	nodes = listNode.querySelectorAll('.item');
	for(let i=0; i<nodes.length; ++i) {
		nodes[i].querySelector('img').src = '';
		nodes[i].querySelector('img').style.backgroundImage = '';
	}
	
	for(let i=0; i<items.length; ++i) {
		let node = listNode.querySelector(`.item[index="${i}"]`);
		
		loadMetadata(contractMixed, items[i].args.tokenId).then((response)=>{
			node.querySelector('img').src = response.image;
		});
		
		let spouseId = items[i].args[spouse].toString();
		node.href = `token.html#${spouseId}`;
		node.querySelector('h4 >span').textContent = `#${spouseId}`;
	}
}

async function loadMetadata(contract, tokenId) {
	let uri = await contract.tokenURI(tokenId);
	let response = await fetch(uri);
	response = await response.json();
	response.tokenId = tokenId;
	return response;
}
