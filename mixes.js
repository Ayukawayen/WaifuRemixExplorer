let itemOffset = parseInt(location.hash.substr(1)) || 0;
let itemCount = 25;

let logs;

let provider;
let contractMixed;
let contractOriginal;

window.addEventListener('hashchange', refreshTokens);

window.ethereum.request({
	method: 'eth_requestAccounts',
}).then((response)=>{
	window.ethereum.request({
		method: 'wallet_switchEthereumChain',
		params: [{ chainId: '0x2710' }],
	}).then(async (response)=>{
		provider = new ethers.providers.Web3Provider(window.ethereum);
		contractMixed = new ethers.Contract(ContractAddrMixed, ContractABIMixed, provider);
		contractOriginal = new ethers.Contract(ContractAddrOriginal, [
			'function tokenURI(uint256 tokenId) view returns (string)',
		], provider);
		
		await loadTokens();
		await refreshTokens();
		
	}).catch((err)=>{
		alert(err.message);
	});
});


(()=>{
	let ul = document.querySelector('#tokens');
	
	for(let i=0; i<itemCount; ++i) {
		let li = createElement('li', {index:i}, [
			createElement('h3', {}, ''),
			createElement('a', {'class':'item main'}, [
				createElement('img', {}, ''),
				createElement('h4', {}, ''),
			]),
			createElement('div', {'class':'symbol'}, '×'),
			createElement('a', {'class':'item model'}, [
				createElement('img', {}, ''),
				createElement('h4', {}, ''),
			]),
			createElement('div', {'class':'symbol'}, '＝'),
			createElement('a', {'class':'item mixed'}, [
				createElement('img', {}, ''),
				createElement('h4', {}, ''),
			]),
		]);
		
		ul.appendChild(li);
	}
})();


async function updateOffset(value, diff) {
	if(diff) {
		value = itemOffset + parseInt(diff);
		if(value<0) {
			value=0;
		}
	} else {
		value = parseInt(value);
	}

	location.hash = '#'+value;
}


async function loadTokens() {
	logs = await contractMixed.queryFilter( contractMixed.filters.Mint() );
}

async function refreshTokens() {
	itemOffset = parseInt(location.hash.substr(1)) || 0;
	document.querySelector('#offset').value = itemOffset;
	
	clearTokens();
	
	for(let i=0; i<itemCount; ++i) {
		let log = logs[itemOffset+i];
		if(!log) {
			let node = document.querySelector(`#tokens >li[index="${i}"]`);
			node.classList.add('hidden');
			continue;
		}
		
		loadMetadata(contractOriginal, log.args.origin).then((response)=>{
			let node = document.querySelector(`#tokens >li[index="${i}"] .main`);
			node.href = `token.html#${log.args.origin}`;
			node.querySelector('img').src = response.image;
			node.querySelector('h4').textContent = `# ${response.tokenId} ${response.name}`;
		});
		loadMetadata(contractOriginal, log.args.model).then((response)=>{
			let node = document.querySelector(`#tokens >li[index="${i}"] .model`);
			node.href = `token.html#${log.args.model}`;
			node.querySelector('img').src = response.image;
			node.querySelector('h4').textContent = `# ${response.tokenId} ${response.name}`;
		});
		loadMetadata(contractMixed, log.args.tokenId).then((response)=>{
			let node = document.querySelector(`#tokens >li[index="${i}"] .mixed`);
			node.querySelector('img').src = response.image;
			node.querySelector('h4').textContent = response.name;
			
			document.querySelector(`#tokens >li[index="${i}"] >h3`).textContent = `#${response.tokenId} ${response.name}`;
		});
	}
}

async function clearTokens() {
	for(let i=0; i<itemCount; ++i) {
		let node;
		
		node = document.querySelector(`#tokens >li[index="${i}"]`);
		node.classList.remove('hidden');
		
		node = document.querySelector(`#tokens >li[index="${i}"] .main`);
		node.href = '';
		node.querySelector('img').src = '';
		node.querySelector('h4').textContent = '';
		
		node = document.querySelector(`#tokens >li[index="${i}"] .model`);
		node.href = '';
		node.querySelector('img').src = '';
		node.querySelector('h4').textContent = ' ';

		node = document.querySelector(`#tokens >li[index="${i}"] .mixed`);
		node.querySelector('img').src = '';
		node.querySelector('h4').textContent = ' ';
		
		document.querySelector(`#tokens >li[index="${i}"] >h3`).textContent = ' ';
	}
}


async function loadMetadata(contract, tokenId) {
	let uri = await contract.tokenURI(tokenId);
	let response = await fetch(uri);
	response = await response.json();
	response.tokenId = tokenId;
	return response;
}
