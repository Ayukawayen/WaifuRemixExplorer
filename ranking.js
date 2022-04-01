let logs;
let countAsModels = {};
let models = [];

let provider;
let contractMixed;
let contractOriginal;

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
	}).catch((err)=>{
		alert(err.message);
	});
});


async function loadTokens() {
	logs = await contractMixed.queryFilter( contractMixed.filters.Mint() );

	for(let i=0; i<logs.length; ++i) {
		let modelId = logs[i].args.model;
		countAsModels[modelId] ||= 0;
		countAsModels[modelId]++;
	}
	
	for(let k in countAsModels) {
		models.push({tokenId:k, count:countAsModels[k]});
	}
	
	models.sort((a,b)=>(b.count - a.count));
	
	
	let listNode = document.querySelector(`#tokens`);
	
	for(let i=0; i<models.length; ++i) {
		let tokenId = models[i].tokenId;
		let node = createElement('li', {}, [
			createElement('a', {'class':'item', tokenId:tokenId, href:`./token.html#${tokenId}`}, [
				createElement('img', {}, ''),
				createElement('span', {'class':'name'}, ''),
				createElement('span', {'class':'count'}, models[i].count.toString()),
			]),
		]);
		
		listNode.appendChild(node);
		
		loadMetadata(contractOriginal, tokenId).then((response)=>{
			node.querySelector('img').src = response.image;
			node.querySelector('.name').textContent = `#${tokenId} ${response.name}`;
		});
	}

}

async function loadMetadata(contract, tokenId) {
	let uri = await contract.tokenURI(tokenId);
	let response = await fetch(uri);
	response = await response.json();
	response.tokenId = tokenId;
	return response;
}
