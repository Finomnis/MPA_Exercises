function w = win(type,N)
% type: Type of the window. Either 'rec', 'sin', or 'hann'
% N:    Length of the window

switch type
    case 'rec'
        w = ones(N,1);
        
    case 'sin'
        w = sin((0:(N-1))'/N*pi);
        
    case 'hann'
        w = (sin((0:(N-1))'/N*pi)).^2;

    otherwise
        error('unknown type.')
end

end

